import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getResultParameter(value: unknown, key: string): unknown {
  if (!Array.isArray(value)) return undefined;
  const entry = value.find(item => isRecord(item) && item.Key === key);
  return isRecord(entry) ? entry.Value : undefined;
}

function acknowledgement(resultCode: number, resultDesc: string) {
  return Response.json({ Result: { ResultCode: resultCode, ResultDesc: resultDesc } });
}

export async function handleDarajaB2CResult(request: Request, timeout = false): Promise<Response> {
  try {
    const token = new URL(request.url).searchParams.get('token');
    if (!token || !/^[0-9a-f-]{36}$/i.test(token)) return acknowledgement(1, 'Invalid callback token');

    const admin = createSupabaseAdminClient();
    const { data: withdrawal, error: withdrawalError } = await admin
      .from('wallet_withdrawals')
      .select('id, status, payout_status, payout_amount_kes, payout_provider_reference')
      .eq('payout_provider', 'daraja')
      .eq('payout_callback_token', token)
      .maybeSingle();
    if (withdrawalError) return acknowledgement(1, 'Could not load withdrawal');
    if (!withdrawal) return acknowledgement(1, 'Withdrawal not found');
    if (withdrawal.status === 'paid' || withdrawal.status === 'rejected') return acknowledgement(0, 'Already processed');

    if (timeout) {
      console.warn('Daraja B2C timed out; awaiting final result callback', { withdrawalId: withdrawal.id });
      return acknowledgement(0, 'Timeout recorded; awaiting final result');
    }

    const body: unknown = await request.json().catch(() => null);
    const result = isRecord(body) && isRecord(body.Result) ? body.Result : null;
    if (!result || !Number.isInteger(Number(result.ResultCode))) return acknowledgement(1, 'Invalid result callback');
    const resultCode = Number(result.ResultCode);

    if (resultCode !== 0) {
      const { error } = await admin.rpc('fail_daraja_wallet_withdrawal', { p_withdrawal_id: withdrawal.id });
      if (error) return acknowledgement(1, 'Could not refund failed withdrawal');
      return acknowledgement(0, 'Failed withdrawal refunded');
    }

    const originatorId = typeof result.OriginatorConversationID === 'string' ? result.OriginatorConversationID : null;
    const conversationId = typeof result.ConversationID === 'string' ? result.ConversationID : null;
    if (
      !conversationId ||
      (withdrawal.payout_provider_reference &&
        withdrawal.payout_provider_reference !== withdrawal.id &&
        withdrawal.payout_provider_reference !== conversationId)
    ) {
      console.error('Daraja B2C result conversation ID mismatch', { withdrawalId: withdrawal.id });
      return acknowledgement(1, 'Conversation ID mismatch');
    }

    const parameters = isRecord(result.ResultParameters) ? result.ResultParameters.ResultParameter : undefined;
    const amountValue = getResultParameter(parameters, 'TransactionAmount');
    const amount = amountValue === undefined ? null : Number(amountValue);
    const transactionId = getResultParameter(parameters, 'TransactionID');
    if (amount === null || !Number.isFinite(amount) || amount !== Number(withdrawal.payout_amount_kes) || typeof transactionId !== 'string' || !transactionId.trim()) {
      console.error('Daraja B2C result did not match expected payout details', { withdrawalId: withdrawal.id });
      return acknowledgement(1, 'Payout details did not match');
    }

    const { data: updated, error: updateError } = await admin
      .from('wallet_withdrawals')
      .update({
        status: 'paid',
        payout_status: 'success',
        payout_provider_reference: conversationId,
        payout_provider_request_id: originatorId,
        payout_reference: transactionId.trim(),
        paid_at: new Date().toISOString(),
      })
      .eq('id', withdrawal.id)
      .in('status', ['pending', 'approved'])
      .in('payout_status', ['initiating', 'queued'])
      .select('id')
      .maybeSingle();
    if (updateError) return acknowledgement(1, 'Could not save successful withdrawal');
    if (!updated) {
      const { data: current } = await admin
        .from('wallet_withdrawals')
        .select('status')
        .eq('id', withdrawal.id)
        .maybeSingle();
      if (current?.status !== 'paid') return acknowledgement(1, 'Withdrawal state changed');
    }

    return acknowledgement(0, 'Accepted');
  } catch {
    return acknowledgement(1, 'Callback processing failed');
  }
}