import { randomUUID } from 'node:crypto';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getMegaPayConfig, postMegaPay } from '@/lib/megapay';

const USD_TO_KES = 131.21;
const MINIMUM_DEPOSIT_USD = 2;
const HOURLY_DEPOSIT_LIMIT = 5;
const DEPOSIT_TIMEOUT_MS = 60_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractTransactionRequestId(value: unknown, depth = 0): string | null {
  if (!isRecord(value) || depth > 4) return null;

  for (const key of [
    'transaction_request_id',
    'transactionRequestId',
    'TransactionRequestID',
    'transaction_id',
    'TransactionID',
    'checkout_request_id',
    'CheckoutRequestID',
    'request_id',
    'requestId',
  ]) {
    const candidate = value[key];
    if ((typeof candidate === 'string' || typeof candidate === 'number') && String(candidate).trim()) {
      return String(candidate).trim();
    }
  }

  for (const key of ['data', 'result', 'response', 'transaction']) {
    const nestedId = extractTransactionRequestId(value[key], depth + 1);
    if (nestedId) return nestedId;
  }

  return null;
}

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return Response.json({ error: 'Sign in to access your wallet.' }, { status: 401 });

    const admin = createSupabaseAdminClient();
    const [walletResult, depositResult, withdrawalResult] = await Promise.all([
      admin.from('app_wallets').select('balance_usd').eq('user_id', user.id).maybeSingle(),
      admin
        .from('wallet_deposits')
        .select('id, amount_usd, amount_kes, status, credited_usd, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      admin
        .from('wallet_withdrawals')
        .select('id, full_name, amount_usd, msisdn, status, admin_note, payout_reference, created_at, reviewed_at, paid_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (walletResult.error || depositResult.error || withdrawalResult.error) {
      return Response.json({ error: 'Wallet service is unavailable.' }, { status: 503 });
    }

    const deposits = depositResult.data ?? [];
    return Response.json({
      balanceUsd: Number(walletResult.data?.balance_usd ?? 0),
      latestDeposit: deposits[0] ?? null,
      deposits,
      withdrawals: withdrawalResult.data ?? [],
    });
  } catch {
    return Response.json({ error: 'Wallet service is unavailable.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return Response.json({ error: 'Sign in before making a deposit.' }, { status: 401 });

    const config = getMegaPayConfig();
    if (!config) {
      return Response.json({ error: 'MegaPay is not configured on this server.' }, { status: 503 });
    }

    const body: unknown = await request.json().catch(() => null);
    if (!isRecord(body) || typeof body.msisdn !== 'string') {
      return Response.json({ error: 'Enter a valid M-Pesa phone number and deposit amount.' }, { status: 400 });
    }

    const amountUsd = Number(body.amountUsd);
    const amountCents = Math.round(amountUsd * 100);
    if (!Number.isFinite(amountUsd) || amountCents < MINIMUM_DEPOSIT_USD * 100 || Math.abs(amountUsd * 100 - amountCents) > 0.000001) {
      return Response.json({ error: 'The minimum deposit is $2.00 USD.' }, { status: 400 });
    }

    const phoneNumber = parsePhoneNumberFromString(body.msisdn, 'KE');
    if (!phoneNumber?.isValid() || phoneNumber.country !== 'KE') {
      return Response.json({ error: 'Enter a valid Kenyan M-Pesa phone number.' }, { status: 400 });
    }

    const amountKes = Math.ceil((amountCents / 100) * USD_TO_KES - 0.0000001);
    const admin = createSupabaseAdminClient();
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
        status: 'initiating',
      })
      .select('id, created_at')
      .single();

    if (insertError || !deposit) {
      return Response.json({ error: 'A deposit is already in progress or the wallet service is unavailable.' }, { status: 409 });
    }

    let providerResponse: unknown;
    try {
      providerResponse = await postMegaPay('initiatestk', {
        api_key: config.apiKey,
        email: config.email,
        amount: amountKes,
        msisdn: phoneNumber.number.slice(1),
        reference,
      });
    } catch {
      return Response.json({ error: 'MegaPay’s response was interrupted. Check your wallet status or contact support before retrying to avoid a duplicate charge.' }, { status: 502 });
    }

    const transactionRequestId = extractTransactionRequestId(providerResponse);
    if (!isRecord(providerResponse) || !transactionRequestId) {
      console.warn('MegaPay STK initiation response could not be tracked', {
        keys: isRecord(providerResponse) ? Object.keys(providerResponse) : [],
        hasTransactionRequestId: Boolean(transactionRequestId),
      });
      return Response.json({ error: 'MegaPay returned an unclear result. Check your wallet status or contact support before retrying.' }, { status: 502 });
    }

    const { error: updateError } = await admin
      .from('wallet_deposits')
      .update({
        provider_request_id: transactionRequestId,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', deposit.id)
      .eq('status', 'initiating');

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