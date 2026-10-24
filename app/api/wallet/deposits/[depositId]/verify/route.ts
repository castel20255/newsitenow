import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getMegaPayConfig, postMegaPay } from '@/lib/megapay';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ depositId: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) {
      return Response.json({ error: 'Sign in to check this deposit.' }, { status: 401 });
    }

    const { depositId } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(depositId)) {
      return Response.json({ error: 'Deposit not found.' }, { status: 404 });
    }

    const admin = createSupabaseAdminClient();
    const { data: deposit, error: depositError } = await admin
      .from('wallet_deposits')
      .select('id, amount_kes, provider_request_id, status, created_at')
      .eq('id', depositId)
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (depositError) return Response.json({ error: 'Wallet service is unavailable.' }, { status: 503 });
    if (!deposit) return Response.json({ error: 'Deposit not found.' }, { status: 404 });

    if (deposit.status === 'completed') {
        const [{ data: wallet }, { data: bonusTransaction }] = await Promise.all([
          admin.from('app_wallets').select('balance_usd').eq('user_id', auth.user.id).maybeSingle(),
          admin.from('app_wallet_transactions').select('amount').eq('user_id', auth.user.id)
            .eq('transaction_type', 'welcome_bonus').eq('reference_id', deposit.id).maybeSingle(),
        ]);
        return Response.json({
          status: 'completed',
          balanceUsd: Number(wallet?.balance_usd ?? 0),
          welcomeBonusUsd: Number(bonusTransaction?.amount ?? 0),
        });
    }
    if (!['pending', 'expired'].includes(deposit.status) || !deposit.provider_request_id) {
      return Response.json({ status: deposit.status });
    }

    const config = getMegaPayConfig();
    if (!config) return Response.json({ error: 'Site payments are not configured yet.' }, { status: 503 });

    let providerResponse: unknown;
    try {
      providerResponse = await postMegaPay('transactionstatus', {
        api_key: config.apiKey,
        email: config.email,
        transaction_request_id: deposit.provider_request_id,
      });
    } catch {
      return Response.json({ error: 'Could not check payment status. Try again shortly.' }, { status: 502 });
    }

    if (!isRecord(providerResponse)) {
      return Response.json({ error: 'The payment service returned an invalid status.' }, { status: 502 });
    }

    const providerStatus = typeof providerResponse.TransactionStatus === 'string'
      ? providerResponse.TransactionStatus.toLowerCase()
      : '';
    const rawResultCode = providerResponse.ResultCode;
    const rawTransactionCode = providerResponse.TransactionCode;
    const hasSuccessfulResultCode = rawResultCode === undefined || rawResultCode === null || rawResultCode === '' || String(rawResultCode) === '200';
    const hasSuccessfulTransactionCode = rawTransactionCode === undefined || rawTransactionCode === null || rawTransactionCode === '' || String(rawTransactionCode) === '0';

    if (
      providerStatus !== 'completed' ||
      !hasSuccessfulResultCode ||
      !hasSuccessfulTransactionCode
    ) {
      if (['failed', 'cancelled', 'canceled', 'expired', 'rejected'].includes(providerStatus)) {
        const { error } = await admin
          .from('wallet_deposits')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', deposit.id)
          .in('status', ['pending', 'expired']);
        if (error) return Response.json({ error: 'Could not update the deposit status.' }, { status: 503 });
        return Response.json({ status: 'failed' });
      }
      const timedOut = Date.now() - new Date(deposit.created_at).getTime() >= 60_000;
      if (timedOut && deposit.status === 'pending') {
        const { error } = await admin
          .from('wallet_deposits')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', deposit.id)
          .eq('status', 'pending');
        if (error) return Response.json({ error: 'Could not update the deposit status.' }, { status: 503 });
        return Response.json({ status: 'expired' });
      }
      return Response.json({ status: timedOut ? 'expired' : 'pending' });
    }

    const rawTransactionId = providerResponse.TransactionID;
    const transactionId = (typeof rawTransactionId === 'string' || typeof rawTransactionId === 'number')
      ? String(rawTransactionId).trim() || deposit.provider_request_id
      : deposit.provider_request_id;
    const reportedAmountKes = Number(providerResponse.TransactionAmount);
    if (Number.isFinite(reportedAmountKes) && reportedAmountKes !== Number(deposit.amount_kes)) {
      console.warn('Completed payment amount differs from the requested amount', {
        depositId: deposit.id,
        expectedAmountKes: Number(deposit.amount_kes),
        reportedAmountKes,
      });
    }

    const receipt = typeof providerResponse.TransactionReceipt === 'string'
      ? providerResponse.TransactionReceipt
      : '';
    const { data: creditResult, error: creditError } = await admin.rpc('complete_megapay_deposit', {
      p_deposit_id: deposit.id,
      p_provider_transaction_id: transactionId,
      p_paid_amount_kes: Number(deposit.amount_kes),
      p_receipt: receipt,
    });

    if (creditError) return Response.json({ error: 'Payment was verified, but the wallet could not be updated. Contact support.' }, { status: 503 });

    const result = Array.isArray(creditResult) ? creditResult[0] : creditResult;
    if (!isRecord(result)) {
      return Response.json({ error: 'Payment was verified, but the wallet balance could not be confirmed.' }, { status: 503 });
    }

    const { data: bonusTransaction } = await admin
      .from('app_wallet_transactions')
      .select('amount')
      .eq('user_id', auth.user.id)
      .eq('transaction_type', 'welcome_bonus')
      .eq('reference_id', deposit.id)
      .maybeSingle();

    return Response.json({
      status: 'completed',
      balanceUsd: Number(result.balance_usd),
      creditedUsd: Number(result.credited_usd),
      welcomeBonusUsd: Number(bonusTransaction?.amount ?? 0),
    });
  } catch {
    return Response.json({ error: 'Wallet service is unavailable.' }, { status: 503 });
  }
}