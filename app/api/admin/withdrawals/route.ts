import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user?.email) return Response.json({ error: 'Sign in required.' }, { status: 401 });

    const { data: admin, error: adminError } = await supabase
      .from('site_admins')
      .select('email')
      .eq('email', auth.user.email.toLowerCase())
      .maybeSingle();
    if (adminError || !admin) return Response.json({ error: 'Admin access required.' }, { status: 403 });

    const { data, error } = await supabase
      .from('wallet_withdrawals')
      .select('id, user_id, full_name, amount_usd, msisdn, status, admin_note, payout_reference, payout_provider, payout_provider_request_id, payout_amount_kes, payout_status, reviewed_by, created_at, reviewed_at, paid_at')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) return Response.json({ error: 'Could not load withdrawal requests.' }, { status: 503 });

    return Response.json({ withdrawals: data ?? [] });
  } catch {
    return Response.json({ error: 'Admin service is unavailable.' }, { status: 503 });
  }
}