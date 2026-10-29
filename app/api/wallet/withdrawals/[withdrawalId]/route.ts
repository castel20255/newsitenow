import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getPayHeroConfig, getPayHeroTransactionStatus, PayHeroApiError } from '@/lib/payhero';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getStringField(value: unknown, keys: string[], depth = 0): string | null {
  if (!isRecord(value) || depth > 4) return null;
  for (const key of keys) {
    const candidate = value[key];
    if ((typeof candidate === 'string' || typeof candidate === 'number') && String(candidate).trim()) {
      return String(candidate).trim();
    }
  }
  for (const key of ['data', 'result', 'response', 'transaction']) {
    const nested = getStringField(value[key], keys, depth + 1);
    if (nested) return nested;
  }
  return null;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ withdrawalId: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) return Response.json({ error: 'Sign in to check this withdrawal.' }, { status: 401 });

    const { withdrawalId } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(withdrawalId)) return Response.json({ error: 'Withdrawal not found.' }, { status: 404 });

    const admin = createSupabaseAdminClient();
    const { data: withdrawal, error: withdrawalError } = await admin
      .from('wallet_withdrawals')
      .select('id, user_id, status, admin_note, payout_provider, payout_request_reference, payout_provider_reference, payout_amount_kes, payout_status, payout_provider_request_id, payout_reference')
      .eq('id', withdrawalId)
      .eq('user_id', auth.user.id)
      .maybeSingle();
    if (withdrawalError) return Response.json({ error: 'Could not load withdrawal status.' }, { status: 503 });
    if (!withdrawal) return Response.json({ error: 'Withdrawal not found.' }, { status: 404 });

    const { data: wallet } = await admin
      .from('app_wallets')
      .select('balance_usd')
      .eq('user_id', auth.user.id)
      .maybeSingle();
    if (withdrawal.status === 'paid' || withdrawal.status === 'rejected') {
      return Response.json({
        status: withdrawal.status,
        payoutStatus: withdrawal.payout_status,
        balanceUsd: Number(wallet?.balance_usd ?? 0),
        rejectionReason: withdrawal.status === 'rejected' && withdrawal.payout_status !== 'failed'
          ? withdrawal.admin_note
          : null,
      });
    }
    if (withdrawal.payout_provider === 'daraja') {
      return Response.json({ status: withdrawal.status, payoutStatus: withdrawal.payout_status, balanceUsd: Number(wallet?.balance_usd ?? 0) });
    }
    if (!['initiating', 'queued'].includes(withdrawal.payout_status)) {
      return Response.json({ status: withdrawal.status, payoutStatus: withdrawal.payout_status, balanceUsd: Number(wallet?.balance_usd ?? 0) });
    }

    const config = getPayHeroConfig();
    if (!config) return Response.json({ error: 'PayHero payments are not configured.' }, { status: 503 });

    let providerResponse: unknown;
    try {
      providerResponse = await getPayHeroTransactionStatus(
        config,
        withdrawal.payout_provider_reference || withdrawal.payout_request_reference || withdrawal.id
      );
    } catch (error) {
      const message = error instanceof PayHeroApiError
        ? `PayHero status check failed (${error.status}): ${error.message}`
        : 'Could not reach PayHero to check this withdrawal.';
      return Response.json({ error: message }, { status: 502 });
    }

    const providerStatus = getStringField(providerResponse, ['status', 'TransactionStatus'])?.toLowerCase();
    if (providerStatus === 'success') {
      const amountText = getStringField(providerResponse, ['amount', 'transaction_amount', 'TransactionAmount']);
      const amountKes = amountText === null ? null : Number(amountText);
      if (amountKes !== null && (!Number.isFinite(amountKes) || amountKes !== Number(withdrawal.payout_amount_kes))) {
        return Response.json({ error: 'PayHero reported success, but the amount does not match this withdrawal. Contact support.' }, { status: 502 });
      }
      const payoutReference = getStringField(providerResponse, [
        'transaction_id', 'TransactionID', 'receipt', 'transaction_receipt', 'TransactionReceipt', 'provider_reference',
      ]) || withdrawal.payout_provider_request_id || withdrawal.payout_provider_reference || withdrawal.id;
      const { data: updated, error: updateError } = await admin
        .from('wallet_withdrawals')
        .update({ status: 'paid', payout_status: 'success', payout_reference: payoutReference, paid_at: new Date().toISOString() })
        .eq('id', withdrawal.id)
        .eq('user_id', auth.user.id)
        .in('status', ['pending', 'approved'])
        .in('payout_status', ['initiating', 'queued'])
        .select('id')
        .maybeSingle();
      if (updateError) return Response.json({ error: 'PayHero confirmed payment, but the withdrawal could not be finalized.' }, { status: 503 });
      if (!updated) {
        const { data: current } = await admin.from('wallet_withdrawals').select('status, payout_status').eq('id', withdrawal.id).maybeSingle();
        if (current?.status !== 'paid') return Response.json({ error: 'Withdrawal status changed while confirming payment.' }, { status: 409 });
      }
      const { data: updatedWallet } = await admin.from('app_wallets').select('balance_usd').eq('user_id', auth.user.id).maybeSingle();
      return Response.json({ status: 'paid', payoutStatus: 'success', balanceUsd: Number(updatedWallet?.balance_usd ?? 0) });
    }

    if (providerStatus === 'failed') {
      const { data: refundResult, error: refundError } = await admin.rpc('fail_payhero_wallet_withdrawal', {
        p_withdrawal_id: withdrawal.id,
      });
      if (refundError) return Response.json({ error: 'PayHero failed the payout, but the reserved balance could not be refunded. Contact support.' }, { status: 503 });
      const refund = Array.isArray(refundResult) ? refundResult[0] : refundResult;
      return Response.json({
        status: 'rejected',
        payoutStatus: 'failed',
        balanceUsd: isRecord(refund) ? Number(refund.wallet_balance_usd) : Number(wallet?.balance_usd ?? 0),
      });
    }

    return Response.json({ status: withdrawal.status, payoutStatus: 'queued', balanceUsd: Number(wallet?.balance_usd ?? 0) });
  } catch {
    return Response.json({ error: 'Withdrawal service is unavailable.' }, { status: 503 });
  }
}