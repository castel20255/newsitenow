import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) return Response.json({ error: 'Sign in to request a withdrawal.' }, { status: 401 });

    const body: unknown = await request.json().catch(() => null);
    if (!isRecord(body) || typeof body.fullName !== 'string' || typeof body.msisdn !== 'string') {
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

    return Response.json({
      withdrawalId: result.withdrawal_id,
      balanceUsd: Number(result.wallet_balance_usd),
      status: result.withdrawal_status,
      rejectionReason: typeof result.rejection_reason === 'string' ? result.rejection_reason : null,
    });
  } catch {
    return Response.json({ error: 'Withdrawal service is unavailable.' }, { status: 503 });
  }
}