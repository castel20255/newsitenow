import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { randomUUID } from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DarajaApiError, ensureDarajaB2CReady, getDarajaB2CConfig, initiateB2CPayment } from '@/lib/daraja';

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

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) return Response.json({ error: 'Sign in to request a withdrawal.' }, { status: 401 });
    const config = getDarajaB2CConfig();
    if (!config) return Response.json({ error: 'M-Pesa Daraja B2C is not configured. Check the consumer credentials, initiator credentials, certificate, and HTTPS callback URLs.' }, { status: 503 });

    const body: unknown = await request.json().catch(() => null);
    if (
      !isRecord(body) ||
      typeof body.fullName !== 'string' ||
      typeof body.msisdn !== 'string'
    ) {
      return Response.json({ error: 'Enter your full name, amount, and M-Pesa number.' }, { status: 400 });
    }

    const fullName = body.fullName.trim();
    const amountUsd = Number(body.amountUsd);
    const amountCents = Math.round(amountUsd * 100);
    const phoneNumber = parsePhoneNumberFromString(body.msisdn, 'KE');
    if (fullName.length < 2 || fullName.length > 120) {
      return Response.json({ error: 'Enter your full name.' }, { status: 400 });
    }
    if (!Number.isFinite(amountUsd) || amountCents <= 0 || Math.abs(amountUsd * 100 - amountCents) > 0.000001) {
      return Response.json({ error: 'Enter a valid withdrawal amount.' }, { status: 400 });
    }
    if (!phoneNumber?.isValid() || phoneNumber.country !== 'KE') {
      return Response.json({ error: 'Enter a valid Kenyan M-Pesa number.' }, { status: 400 });
    }

    try {
      await ensureDarajaB2CReady(config);
    } catch (error) {
      const message = error instanceof DarajaApiError
        ? `Daraja OAuth failed (${error.status}): ${error.message}`
        : 'Could not connect to Daraja OAuth. No withdrawal was submitted; retry later.';
      return Response.json({ error: message }, { status: 502 });
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc('request_wallet_withdrawal', {
      p_full_name: fullName,
      p_amount_usd: amountCents / 100,
      p_msisdn: phoneNumber.number.slice(1),
    });
    if (error) {
      const message = error.message.includes('Insufficient')
        ? 'Your Real Wallet balance is insufficient.'
        : 'Could not submit the withdrawal request.';
      return Response.json({ error: message }, { status: 400 });
    }

    const result = Array.isArray(data) ? data[0] : data;
    if (!isRecord(result)) return Response.json({ error: 'Could not confirm the withdrawal request.' }, { status: 503 });

    const withdrawalId = String(result.withdrawal_id);
    const amountKes = Math.ceil((amountCents / 100) * USD_TO_KES - 0.0000001);
    const callbackToken = randomUUID();
    const { data: claimed, error: claimError } = await admin
      .from('wallet_withdrawals')
      .update({
        payout_provider: 'daraja',
        payout_request_reference: withdrawalId,
        payout_provider_reference: withdrawalId,
        payout_callback_token: callbackToken,
        payout_amount_kes: amountKes,
        payout_status: 'initiating',
      })
      .eq('id', withdrawalId)
      .eq('user_id', auth.user.id)
      .eq('status', 'pending')
      .eq('payout_status', 'not_started')
      .select('id')
      .maybeSingle();
    if (claimError || !claimed) {
      return Response.json({ error: 'Your withdrawal is reserved, but payout setup did not finish. Contact support before submitting another withdrawal.' }, { status: 503 });
    }

    let providerResponse: unknown;
    try {
      providerResponse = await initiateB2CPayment(config, {
        amount: amountKes,
        phoneNumber: phoneNumber.number,
        reference: withdrawalId,
        callbackToken,
      });
    } catch (error) {
      if (error instanceof DarajaApiError && error.status >= 400 && error.status < 500) {
        const { data: refundResult, error: refundError } = await admin.rpc('fail_daraja_wallet_withdrawal', {
          p_withdrawal_id: withdrawalId,
        });
        if (refundError) return Response.json({ error: 'Daraja rejected the payout, but the reserved balance could not be refunded. Contact support.' }, { status: 503 });
        const refund = Array.isArray(refundResult) ? refundResult[0] : refundResult;
        return Response.json({
          error: `M-Pesa Daraja rejected the withdrawal (${error.status}): ${error.message}`,
          balanceUsd: isRecord(refund) ? Number(refund.wallet_balance_usd) : Number(result.wallet_balance_usd),
        }, { status: 502 });
      }
      return Response.json({
        withdrawalId,
        balanceUsd: Number(result.wallet_balance_usd),
        status: 'pending',
        payoutStatus: 'initiating',
      }, { status: 202 });
    }

    const providerResponseCode = isRecord(providerResponse) ? providerResponse.ResponseCode : undefined;
    if (providerResponseCode !== undefined && String(providerResponseCode) !== '0') {
      const { data: refundResult, error: refundError } = await admin.rpc('fail_daraja_wallet_withdrawal', {
        p_withdrawal_id: withdrawalId,
      });
      if (refundError) return Response.json({ error: 'Daraja rejected the payout, but the reserved balance could not be refunded. Contact support.' }, { status: 503 });
      const refund = Array.isArray(refundResult) ? refundResult[0] : refundResult;
      return Response.json({
        error: 'M-Pesa Daraja could not start the withdrawal. The reserved balance has been refunded.',
        balanceUsd: isRecord(refund) ? Number(refund.wallet_balance_usd) : Number(result.wallet_balance_usd),
      }, { status: 502 });
    }

    const providerReference = isRecord(providerResponse) && typeof providerResponse.ConversationID === 'string'
      ? providerResponse.ConversationID
      : withdrawalId;
    const providerRequestId = isRecord(providerResponse) && typeof providerResponse.OriginatorConversationID === 'string'
      ? providerResponse.OriginatorConversationID
      : null;
    const { error: saveError } = await admin
      .from('wallet_withdrawals')
      .update({ payout_provider_reference: providerReference, payout_provider_request_id: providerRequestId, payout_status: 'queued' })
      .eq('id', withdrawalId)
      .eq('payout_status', 'initiating');
    if (saveError) {
      return Response.json({ error: 'Daraja may have accepted the withdrawal. Check the wallet status before submitting another.' }, { status: 503 });
    }

    return Response.json({
      withdrawalId,
      balanceUsd: Number(result.wallet_balance_usd),
      status: 'pending',
      payoutStatus: 'queued',
    });
  } catch {
    return Response.json({ error: 'Withdrawal service is unavailable.' }, { status: 503 });
  }
}