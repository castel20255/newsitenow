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
      .select('id, amount_kes, msisdn, reference, provider_request_id, status, created_at')
      .eq('id', depositId)
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (depositError) return Response.json({ error: 'Wallet service is unavailable.' }, { status: 503 });
    if (!deposit) return Response.json({ error: 'Deposit not found.' }, { status: 404 });

    if (deposit.status === 'completed') {
      const { data: wallet } = await admin
        .from('app_wallets')
        .select('balance_usd')
        .eq('user_id', auth.user.id)
        .maybeSingle();
      return Response.json({ status: 'completed', balanceUsd: Number(wallet?.balance_usd ?? 0) });
    }
    if (!['pending', 'expired'].includes(deposit.status) || !deposit.provider_request_id) {
      return Response.json({ status: deposit.status });
    }

    const config = getMegaPayConfig();
    if (!config) return Response.json({ error: 'MegaPay is not configured on this server.' }, { status: 503 });

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
      return Response.json({ error: 'MegaPay returned an invalid status response.' }, { status: 502 });
    }

    const providerStatus = typeof providerResponse.TransactionStatus === 'string'
      ? providerResponse.TransactionStatus.toLowerCase()
      : '';

    if (
      String(providerResponse.ResultCode) !== '200' ||
      providerStatus !== 'completed' ||
      String(providerResponse.TransactionCode) !== '0'
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

    const transactionId = providerResponse.TransactionID;
    const paidAmountKes = Number(providerResponse.TransactionAmount);
    const providerPhone = typeof providerResponse.Msisdn === 'string'
      ? providerResponse.Msisdn.replace(/\D/g, '')
      : '';
    const savedPhone = String(deposit.msisdn).replace(/\D/g, '');
    if (
      typeof transactionId !== 'string' ||
      !transactionId.trim() ||
      !Number.isFinite(paidAmountKes) ||
      paidAmountKes !== Number(deposit.amount_kes) ||
      providerPhone !== savedPhone ||
      String(providerResponse.TransactionReference) !== deposit.reference
    ) {
      return Response.json({ error: 'The completed payment details did not match this deposit.' }, { status: 409 });
    }

    const receipt = typeof providerResponse.TransactionReceipt === 'string'
      ? providerResponse.TransactionReceipt
      : '';
    const { data: creditResult, error: creditError } = await admin.rpc('complete_megapay_deposit', {
      p_deposit_id: deposit.id,
      p_provider_transaction_id: transactionId,
      p_paid_amount_kes: paidAmountKes,
      p_receipt: receipt,
    });

    if (creditError) return Response.json({ error: 'Payment was verified, but the wallet could not be updated. Contact support.' }, { status: 503 });

    const result = Array.isArray(creditResult) ? creditResult[0] : creditResult;
    if (!isRecord(result)) {
      return Response.json({ error: 'Payment was verified, but the wallet balance could not be confirmed.' }, { status: 503 });
    }

    return Response.json({
      status: 'completed',
      balanceUsd: Number(result.balance_usd),
      creditedUsd: Number(result.credited_usd),
    });
  } catch {
    return Response.json({ error: 'Wallet service is unavailable.' }, { status: 503 });
  }
}