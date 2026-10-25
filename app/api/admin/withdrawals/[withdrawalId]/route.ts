import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getPayHeroConfig, getPayHeroTransactionStatus, initiatePayHeroWithdrawal } from '@/lib/payhero';

const USD_TO_KES = 131.21;

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ withdrawalId: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user?.email) return Response.json({ error: 'Sign in required.' }, { status: 401 });

    const { data: adminRecord, error: adminError } = await supabase
      .from('site_admins')
      .select('email')
      .eq('email', auth.user.email.toLowerCase())
      .maybeSingle();
    if (adminError || !adminRecord) return Response.json({ error: 'Admin access required.' }, { status: 403 });

    const { withdrawalId } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(withdrawalId)) {
      return Response.json({ error: 'Withdrawal request not found.' }, { status: 404 });
    }

    const body: unknown = await request.json().catch(() => null);
    if (!isRecord(body) || !['approve', 'reject', 'check'].includes(String(body.action))) {
      return Response.json({ error: 'Choose a valid withdrawal action.' }, { status: 400 });
    }
    const action = String(body.action);
    const admin = createSupabaseAdminClient();
    const { data: withdrawal, error: withdrawalError } = await admin
      .from('wallet_withdrawals')
      .select('id, amount_usd, msisdn, status, payout_provider, payout_request_reference, payout_provider_request_id, payout_amount_kes, payout_status')
      .eq('id', withdrawalId)
      .maybeSingle();
    if (withdrawalError) return Response.json({ error: 'Could not load withdrawal request.' }, { status: 503 });
    if (!withdrawal) return Response.json({ error: 'Withdrawal request not found.' }, { status: 404 });

    if (action === 'reject') {
      const { data, error } = await supabase.rpc('admin_update_wallet_withdrawal', {
        p_withdrawal_id: withdrawalId,
        p_action: 'reject',
        p_admin_note: typeof body.adminNote === 'string' ? body.adminNote.trim() : null,
        p_payout_reference: null,
      });
      if (error) return Response.json({ error: 'Could not reject this withdrawal. A payout may already be in progress.' }, { status: 409 });
      const result = Array.isArray(data) ? data[0] : data;
      return isRecord(result)
        ? Response.json({ id: result.withdrawal_id, status: result.withdrawal_status })
        : Response.json({ error: 'Could not confirm the withdrawal update.' }, { status: 503 });
    }

    const config = getPayHeroConfig();
    if (!config) return Response.json({ error: 'PayHero payments are not configured.' }, { status: 503 });

    if (action === 'approve' && withdrawal.status === 'pending') {
      const { error } = await supabase.rpc('admin_update_wallet_withdrawal', {
        p_withdrawal_id: withdrawalId,
        p_action: 'approve',
        p_admin_note: typeof body.adminNote === 'string' ? body.adminNote.trim() : null,
        p_payout_reference: null,
      });
      if (error) return Response.json({ error: 'Could not approve this withdrawal request.' }, { status: 409 });
      withdrawal.status = 'approved';
    }

    if (withdrawal.status !== 'approved') {
      return Response.json({ error: 'Only approved withdrawals can be sent or checked.' }, { status: 409 });
    }

    const payoutReference = withdrawal.payout_request_reference || withdrawal.id;
    if (action === 'approve') {
      if (withdrawal.payout_status !== 'not_started') {
        return Response.json({ id: withdrawal.id, status: withdrawal.status, payoutStatus: withdrawal.payout_status });
      }

      const amountKes = Math.ceil(Number(withdrawal.amount_usd) * USD_TO_KES - 0.0000001);
      const { data: claimed, error: claimError } = await admin
        .from('wallet_withdrawals')
        .update({
          payout_provider: 'payhero',
          payout_request_reference: payoutReference,
          payout_amount_kes: amountKes,
          payout_status: 'initiating',
        })
        .eq('id', withdrawalId)
        .eq('payout_status', 'not_started')
        .select('id')
        .maybeSingle();
      if (claimError) return Response.json({ error: 'Could not reserve the PayHero payout request.' }, { status: 503 });
      if (!claimed) return Response.json({ id: withdrawal.id, status: withdrawal.status, payoutStatus: 'initiating' });

      let providerResponse: unknown;
      try {
        providerResponse = await initiatePayHeroWithdrawal(config, {
          amount: amountKes,
          phoneNumber: withdrawal.msisdn,
          reference: payoutReference,
        });
      } catch {
        return Response.json({ error: 'PayHero did not confirm whether the payout was accepted. Check its status before retrying.' }, { status: 502 });
      }

      const providerStatus = getStringField(providerResponse, ['status', 'TransactionStatus'])?.toLowerCase();
      const providerRequestId = getStringField(providerResponse, [
        'checkout_request_id', 'CheckoutRequestID', 'conversation_id', 'conversationId', 'merchant_reference', 'reference',
      ]);
      const payoutStatus = providerStatus === 'failed' || (isRecord(providerResponse) && providerResponse.success === false)
        ? 'failed'
        : 'queued';
      const { error: saveError } = await admin
        .from('wallet_withdrawals')
        .update({ payout_provider_request_id: providerRequestId, payout_status: payoutStatus })
        .eq('id', withdrawalId)
        .eq('payout_status', 'initiating');
      if (saveError) return Response.json({ error: 'PayHero may have accepted the payout, but its status could not be saved. Check status before retrying.' }, { status: 503 });
      return Response.json({ id: withdrawal.id, status: withdrawal.status, payoutStatus });
    }

    if (!withdrawal.payout_request_reference || !['initiating', 'queued'].includes(withdrawal.payout_status)) {
      return Response.json({ error: 'There is no pending PayHero payout to check.' }, { status: 409 });
    }

    let statusResponse: unknown;
    try {
      statusResponse = await getPayHeroTransactionStatus(config, withdrawal.payout_request_reference);
    } catch {
      return Response.json({ error: 'Could not check PayHero payout status. Try again shortly.' }, { status: 502 });
    }
    const providerStatus = getStringField(statusResponse, ['status', 'TransactionStatus'])?.toLowerCase();
    if (providerStatus === 'success') {
      const reportedAmountKes = Number(getStringField(statusResponse, ['amount', 'transaction_amount', 'TransactionAmount']));
      if (!Number.isFinite(reportedAmountKes) || reportedAmountKes !== Number(withdrawal.payout_amount_kes)) {
        return Response.json({ error: 'PayHero reported success, but the payout amount did not match. Review it before recording payment.' }, { status: 502 });
      }
      const paidReference = getStringField(statusResponse, [
        'transaction_id', 'TransactionID', 'receipt', 'transaction_receipt', 'TransactionReceipt', 'reference',
      ]) || withdrawal.payout_provider_request_id || withdrawal.payout_request_reference;
      const { error: paidError } = await supabase.rpc('admin_update_wallet_withdrawal', {
        p_withdrawal_id: withdrawalId,
        p_action: 'paid',
        p_admin_note: typeof body.adminNote === 'string' ? body.adminNote.trim() : null,
        p_payout_reference: paidReference,
      });
      if (paidError) return Response.json({ error: 'PayHero confirmed payment, but the withdrawal record could not be finalized.' }, { status: 503 });
      const { error: saveError } = await admin
        .from('wallet_withdrawals')
        .update({ payout_status: 'success' })
        .eq('id', withdrawalId);
      if (saveError) return Response.json({ error: 'Payment was recorded, but the PayHero status could not be saved.' }, { status: 503 });
      return Response.json({ id: withdrawal.id, status: 'paid', payoutStatus: 'success' });
    }

    if (providerStatus === 'failed') {
      const { error } = await admin
        .from('wallet_withdrawals')
        .update({ payout_status: 'failed' })
        .eq('id', withdrawalId)
        .in('payout_status', ['initiating', 'queued']);
      if (error) return Response.json({ error: 'Could not save the failed PayHero status.' }, { status: 503 });
      return Response.json({ id: withdrawal.id, status: withdrawal.status, payoutStatus: 'failed' });
    }

    return Response.json({ id: withdrawal.id, status: withdrawal.status, payoutStatus: 'queued' });
  } catch {
    return Response.json({ error: 'Admin service is unavailable.' }, { status: 503 });
  }
}