import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) {
      return Response.json({ error: 'Sign in to check your welcome bonus.' }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from('app_wallet_transactions')
      .select('id')
      .eq('user_id', auth.user.id)
      .eq('transaction_type', 'welcome_bonus')
      .limit(1);
    if (error) return Response.json({ error: 'Wallet service is unavailable.' }, { status: 503 });

    return Response.json({ claimed: (data?.length ?? 0) > 0 });
  } catch {
    return Response.json({ error: 'Wallet service is unavailable.' }, { status: 503 });
  }
}