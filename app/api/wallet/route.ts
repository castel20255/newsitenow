import { randomUUID } from 'node:crypto';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DarajaApiError, ensureDarajaAccessToken, getDarajaConfig, initiateStkPush } from '@/lib/daraja';
import { getWalletPaymentProvider } from '@/lib/wallet-payment-provider';

const USD_TO_KES = 131.21;
const HOURLY_DEPOSIT_LIMIT = 5;
const DEPOSIT_TIMEOUT_MS = 60_000;
const WALLET_ACTIVITY_PAGE_SIZE = 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}

async function loadAllWalletRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
) {
  const rows: T[] = [];
  for (let from = 0; ; from += WALLET_ACTIVITY_PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + WALLET_ACTIVITY_PAGE_SIZE - 1);
    if (error) return { data: null, error };
    const page = data ?? [];
    rows.push(...page);
    if (page.length < WALLET_ACTIVITY_PAGE_SIZE) return { data: rows, error: null };
  }
}

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return Response.json({ error: 'Sign in to access your wallet.' }, { status: 401 });

    const admin = createSupabaseAdminClient();
    const [walletResult, depositResult, withdrawalResult, appTransactionsResult, demoTransactionsResult, depositSettingsResult] = await Promise.all([
      admin.from('app_wallets').select('balance_usd').eq('user_id', user.id).maybeSingle(),
      loadAllWalletRows((from, to) => admin
        .from('wallet_deposits')
        .select('id, amount_usd, amount_kes, status, credited_usd, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to)),
      loadAllWalletRows((from, to) => admin
        .from('wallet_withdrawals')
        .select('id, full_name, amount_usd, msisdn, status, admin_note, payout_reference, created_at, reviewed_at, paid_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to)),
      loadAllWalletRows((from, to) => admin
        .from('app_wallet_transactions')
        .select('id, transaction_type, amount, balance_after, reference_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to)),
      loadAllWalletRows((from, to) => admin
        .from('wallet_transactions')
        .select('id, transaction_type, amount, balance_after, reference_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to)),
      admin.from('user_deposit_settings').select('minimum_deposit_usd').eq('user_id', user.id).maybeSingle(),
    ]);

    if (walletResult.error || depositResult.error || withdrawalResult.error || appTransactionsResult.error || demoTransactionsResult.error || depositSettingsResult.error) {
      return Response.json({ error: 'Wallet service is unavailable.' }, { status: 503 });
    }

    let trades: Record<string, unknown>[] = [];
    if (new URL(request.url).searchParams.get('includeTrades') === 'true') {
      const [paperTradesResult, digitTradesResult] = await Promise.all([
        loadAllWalletRows((from, to) => admin
          .from('paper_trades')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(from, to)),
        loadAllWalletRows((from, to) => admin
          .from('digit_market_trades')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(from, to)),
      ]);
      if (paperTradesResult.error || digitTradesResult.error) {
        return Response.json({ error: 'Could not load trade history.' }, { status: 503 });
      }
      trades = [
        ...(paperTradesResult.data ?? []).map(trade => ({ ...trade, source: 'contract' })),
        ...(digitTradesResult.data ?? []).map(trade => ({ ...trade, source: 'digit' })),
      ].sort((left, right) => new Date(String(right.created_at)).valueOf() - new Date(String(left.created_at)).valueOf());
    }

    const deposits = depositResult.data ?? [];
    const transactions = [
      ...(appTransactionsResult.data ?? []).map(transaction => ({
        ...transaction,
        account: 'app_wallet' as const,
        description: transaction.transaction_type === 'welcome_bonus'
          ? 'Welcome bonus'
          : transaction.transaction_type === 'admin_deposit'
          ? 'M-Pesa deposit'
          : transaction.transaction_type === 'admin_withdrawal'
            ? 'M-Pesa withdrawal'
            : transaction.transaction_type === 'simulated_stake' ? 'Trade stake' : 'Trade payout',
      })),
      ...(demoTransactionsResult.data ?? []).map(transaction => ({
        ...transaction,
        account: 'demo' as const,
        description: transaction.transaction_type === 'demo_credit'
          ? 'Demo account credit'
          : transaction.transaction_type === 'demo_stake' ? 'Trade stake' : 'Trade payout',
      })),
      ...(deposits.map(deposit => ({
        id: deposit.id,
        transaction_type: 'deposit',
        amount: Number(deposit.credited_usd ?? deposit.amount_usd),
        balance_after: null,
        reference_id: deposit.id,
        created_at: deposit.created_at,
        account: 'app_wallet' as const,
        description: 'M-Pesa deposit',
        status: deposit.status,
        deposit: {
          id: deposit.id,
          amount_usd: Number(deposit.amount_usd),
          amount_kes: Number(deposit.amount_kes),
          status: deposit.status,
          created_at: deposit.created_at,
          credited_usd: deposit.credited_usd === null ? null : Number(deposit.credited_usd),
        },
      }))),
      ...((withdrawalResult.data ?? []).map(withdrawal => ({
        id: withdrawal.id,
        transaction_type: withdrawal.status === 'rejected' ? 'withdrawal_reversed' : 'withdrawal',
        amount: withdrawal.status === 'rejected' ? Number(withdrawal.amount_usd) : -Number(withdrawal.amount_usd),
        balance_after: null,
        reference_id: withdrawal.id,
        created_at: withdrawal.created_at,
        account: 'app_wallet' as const,
        description: withdrawal.status === 'rejected' ? 'Rejected withdrawal refund' : 'M-Pesa withdrawal',
        status: withdrawal.status,
      }))),
    ].sort((left, right) => new Date(right.created_at).valueOf() - new Date(left.created_at).valueOf());

    return Response.json({
      balanceUsd: Number(walletResult.data?.balance_usd ?? 0),
      minimumDepositUsd: Math.max(Number(depositSettingsResult.data?.minimum_deposit_usd ?? 5), 5),
      welcomeBonusClaimed: (appTransactionsResult.data ?? []).some(transaction => transaction.transaction_type === 'welcome_bonus'),
      latestDeposit: deposits[0] ?? null,
      deposits,
      withdrawals: withdrawalResult.data ?? [],
      transactions,
      trades,
    });
  } catch {
    return Response.json({ error: 'Wallet service is unavailable.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return Response.json({ error: 'Sign in before making a deposit.' }, { status: 401 });

    const paymentProvider = getWalletPaymentProvider();
    const darajaConfig = getDarajaConfig();
    if (!darajaConfig) {
      return Response.json({ error: 'M-Pesa Daraja is not configured. Check the server-side MPESA variables and HTTPS callback URL.' }, { status: 503 });
    }

    const body: unknown = await request.json().catch(() => null);
    if (!isRecord(body) || typeof body.msisdn !== 'string') {
      return Response.json({ error: 'Enter a valid M-Pesa phone number and deposit amount.' }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data: depositSettings, error: settingsError } = await admin
      .from('user_deposit_settings')
      .select('minimum_deposit_usd')
      .eq('user_id', user.id)
      .maybeSingle();
    if (settingsError) return Response.json({ error: 'Wallet service is unavailable.' }, { status: 503 });

    const minimumDepositUsd = Math.max(Number(depositSettings?.minimum_deposit_usd ?? 5), 5);
    const amountUsd = Number(body.amountUsd);
    const isWelcomeBonusDeposit = body.welcomeBonus === true;
    const requiredMinimumUsd = minimumDepositUsd;
    const amountCents = Math.round(amountUsd * 100);
    if (!Number.isFinite(amountUsd) || amountCents < requiredMinimumUsd * 100 || Math.abs(amountUsd * 100 - amountCents) > 0.000001) {
      return Response.json({ error: `The minimum deposit is $${requiredMinimumUsd.toFixed(2)} USD.` }, { status: 400 });
    }

    const phoneNumber = parsePhoneNumberFromString(body.msisdn, 'KE');
    if (!phoneNumber?.isValid() || phoneNumber.country !== 'KE') {
      return Response.json({ error: 'Enter a valid Kenyan M-Pesa phone number.' }, { status: 400 });
    }

    try {
      await ensureDarajaAccessToken(darajaConfig);
    } catch (error) {
      const message = error instanceof DarajaApiError
        ? `Daraja OAuth failed (${error.status}): ${error.message}`
        : 'Could not connect to Daraja OAuth. No deposit was created; retry later.';
      return Response.json({ error: message }, { status: 502 });
    }

    const amountKes = Math.ceil((amountCents / 100) * USD_TO_KES - 0.0000001);
    const expiredBefore = new Date(Date.now() - DEPOSIT_TIMEOUT_MS).toISOString();
    const { error: expireError } = await admin
      .from('wallet_deposits')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .in('status', ['initiating', 'pending'])
      .lt('created_at', expiredBefore);
    if (expireError) return Response.json({ error: 'Wallet service is unavailable.' }, { status: 503 });

    const { data: openDeposit, error: openDepositError } = await admin
      .from('wallet_deposits')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['initiating', 'pending'])
      .maybeSingle();
    if (openDepositError) return Response.json({ error: 'Wallet service is unavailable.' }, { status: 503 });
    if (openDeposit) {
      return Response.json({ error: 'Finish or check your current deposit before starting another.' }, { status: 409 });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentDepositCount, error: countError } = await admin
      .from('wallet_deposits')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo);
    if (countError) return Response.json({ error: 'Wallet service is unavailable.' }, { status: 503 });
    if ((recentDepositCount ?? 0) >= HOURLY_DEPOSIT_LIMIT) {
      return Response.json({ error: 'Too many deposit requests. Try again later.' }, { status: 429 });
    }

    const reference = randomUUID();
    const { data: deposit, error: insertError } = await admin
      .from('wallet_deposits')
      .insert({
        user_id: user.id,
        amount_usd: (amountCents / 100).toFixed(2),
        amount_kes: amountKes,
        fx_rate: USD_TO_KES,
        msisdn: phoneNumber.number,
        reference,
        payment_provider: paymentProvider,
        status: 'initiating',
        welcome_bonus_eligible: isWelcomeBonusDeposit,
      })
      .select('id, created_at')
      .single();

    if (insertError || !deposit) {
      return Response.json({ error: 'A deposit is already in progress or the wallet service is unavailable.' }, { status: 409 });
    }

    const { error: pendingError } = await admin
      .from('wallet_deposits')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', deposit.id)
      .eq('status', 'initiating');
    if (pendingError) return Response.json({ error: 'Could not prepare the Daraja payment request.' }, { status: 503 });

    let providerResponse: unknown;
    try {
      providerResponse = await initiateStkPush(darajaConfig, {
        amount: amountKes,
        phoneNumber: phoneNumber.number,
        reference,
      });
    } catch (error) {
      if (error instanceof DarajaApiError && error.status >= 400 && error.status < 500) {
        await admin
          .from('wallet_deposits')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', deposit.id)
          .in('status', ['initiating', 'pending']);
      }
      const message = error instanceof DarajaApiError
        ? `M-Pesa Daraja rejected the STK request (${error.status}): ${error.message}`
        : 'Could not reach M-Pesa Daraja. Check wallet status before retrying to avoid a duplicate charge.';
      return Response.json({ error: message }, { status: 502 });
    }

    const darajaResponseCode = isRecord(providerResponse) ? providerResponse.ResponseCode : undefined;
    if (isRecord(providerResponse) && darajaResponseCode !== undefined && String(darajaResponseCode) !== '0') {
      const { error: failureUpdateError } = await admin
        .from('wallet_deposits')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', deposit.id)
        .in('status', ['initiating', 'pending']);
      if (failureUpdateError) {
        return Response.json({ error: 'Daraja rejected the STK request, but its status could not be saved. Contact support before retrying.' }, { status: 503 });
      }
      const rejection = [providerResponse.errorMessage, providerResponse.ResponseDescription, providerResponse.error]
        .find(value => typeof value === 'string');
      return Response.json({
        error: typeof rejection === 'string' ? `M-Pesa Daraja rejected the STK request: ${rejection.slice(0, 240)}` : 'M-Pesa Daraja rejected the STK request.',
      }, { status: 502 });
    }
    const transactionRequestId = isRecord(providerResponse) && typeof providerResponse.CheckoutRequestID === 'string'
      ? providerResponse.CheckoutRequestID.trim()
      : '';
    if (!isRecord(providerResponse) || !transactionRequestId) {
      console.warn('Daraja STK response could not be tracked', {
        keys: isRecord(providerResponse) ? Object.keys(providerResponse) : [],
      });
      return Response.json({ error: 'Daraja accepted an unclear response. Check your wallet status or contact support before retrying.' }, { status: 502 });
    }

    const { error: updateError } = await admin
      .from('wallet_deposits')
      .update({
        provider_request_id: transactionRequestId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deposit.id)
      .eq('status', 'pending');

    if (updateError) return Response.json({ error: 'The request was sent, but its status could not be saved. Contact support before retrying.' }, { status: 503 });

    return Response.json({
      depositId: deposit.id,
      amountUsd: amountCents / 100,
      amountKes,
      status: 'pending',
      createdAt: deposit.created_at,
    });
  } catch {
    return Response.json({ error: 'Wallet service is unavailable.' }, { status: 503 });
  }
}