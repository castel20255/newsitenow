import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getDarajaConfig, queryStkPush } from '@/lib/daraja';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getMetadataValue(items: unknown, name: string): unknown {
  if (!Array.isArray(items)) return undefined;
  const entry = items.find(item => isRecord(item) && item.Name === name);
  return isRecord(entry) ? entry.Value : undefined;
}

function darajaCallbackResponse(resultCode: number, resultDesc: string) {
  return Response.json({ ResultCode: resultCode, ResultDesc: resultDesc });
}

export async function POST(request: Request) {
  try {
    const reference = new URL(request.url).searchParams.get('reference');
    const body: unknown = await request.json().catch(() => null);
    const callback = isRecord(body) && isRecord(body.Body) && isRecord(body.Body.stkCallback)
      ? body.Body.stkCallback
      : null;
    if (!callback || !reference || typeof callback.CheckoutRequestID !== 'string') {
      return darajaCallbackResponse(1, 'Invalid callback');
    }

    const admin = createSupabaseAdminClient();
    const { data: deposit, error: depositError } = await admin
      .from('wallet_deposits')
      .select('id, amount_kes, msisdn, provider_request_id, status')
      .eq('reference', reference)
      .eq('payment_provider', 'daraja')
      .maybeSingle();
    if (depositError) return darajaCallbackResponse(1, 'Could not load deposit');
    if (!deposit) return darajaCallbackResponse(1, 'Deposit not found');
    if (deposit.status === 'completed' || deposit.status === 'failed') {
      return darajaCallbackResponse(0, 'Callback already processed');
    }
    if (deposit.provider_request_id && deposit.provider_request_id !== callback.CheckoutRequestID) {
      console.warn('Daraja callback checkout ID mismatch', { depositId: deposit.id });
      return darajaCallbackResponse(1, 'Checkout ID mismatch');
    }

    const resultCode = Number(callback.ResultCode);
    if (!Number.isInteger(resultCode)) return darajaCallbackResponse(1, 'Invalid result code');
    const config = getDarajaConfig();
    if (!config) return darajaCallbackResponse(1, 'Daraja is not configured');

    const { error: checkoutUpdateError } = await admin
      .from('wallet_deposits')
      .update({ provider_request_id: callback.CheckoutRequestID, updated_at: new Date().toISOString() })
      .eq('id', deposit.id)
      .eq('payment_provider', 'daraja')
      .in('status', ['initiating', 'pending', 'expired']);
    if (checkoutUpdateError) return darajaCallbackResponse(1, 'Could not save checkout ID');

    let queryResponse: unknown;
    try {
      queryResponse = await queryStkPush(config, callback.CheckoutRequestID);
    } catch {
      return darajaCallbackResponse(1, 'Could not verify checkout with Daraja');
    }
    if (
      !isRecord(queryResponse) ||
      queryResponse.CheckoutRequestID !== callback.CheckoutRequestID ||
      String(queryResponse.ResultCode) !== String(resultCode)
    ) {
      return darajaCallbackResponse(1, 'Daraja checkout result did not match callback');
    }

    if (resultCode !== 0) {
      const resultDescription = typeof queryResponse.ResultDesc === 'string'
        ? queryResponse.ResultDesc.slice(0, 300)
        : typeof callback.ResultDesc === 'string'
          ? callback.ResultDesc.slice(0, 300)
          : 'M-Pesa payment was not completed.';
      const { error } = await admin
        .from('wallet_deposits')
        .update({
          status: 'failed',
          provider_request_id: callback.CheckoutRequestID,
          provider_result_code: String(resultCode),
          provider_result_description: resultDescription,
          updated_at: new Date().toISOString(),
        })
        .eq('id', deposit.id)
        .in('status', ['initiating', 'pending']);
      if (error) return darajaCallbackResponse(1, 'Could not save failed payment');
      return darajaCallbackResponse(0, 'Payment was not completed');
    }

    const metadata = isRecord(callback.CallbackMetadata) ? callback.CallbackMetadata : {};
    const items = metadata.Item;
    const amount = Number(getMetadataValue(items, 'Amount'));
    const phoneNumber = String(getMetadataValue(items, 'PhoneNumber') ?? '').replace(/\D/g, '');
    const receipt = getMetadataValue(items, 'MpesaReceiptNumber');
    if (
      !Number.isFinite(amount) || amount !== Number(deposit.amount_kes) ||
      phoneNumber !== deposit.msisdn.replace(/\D/g, '') ||
      typeof receipt !== 'string' || !receipt.trim()
    ) {
      console.error('Daraja STK callback did not match the saved deposit', { depositId: deposit.id });
      return darajaCallbackResponse(1, 'Payment details did not match the deposit');
    }

    const { error: creditError } = await admin.rpc('complete_wallet_deposit', {
      p_deposit_id: deposit.id,
      p_provider_transaction_id: receipt.trim(),
      p_paid_amount_kes: amount,
      p_receipt: receipt.trim(),
    });
    if (creditError) {
      console.error('Daraja STK callback wallet credit failed', { depositId: deposit.id });
      return darajaCallbackResponse(1, 'Could not credit wallet');
    }

    return darajaCallbackResponse(0, 'Accepted');
  } catch {
    return darajaCallbackResponse(1, 'Callback processing failed');
  }
}