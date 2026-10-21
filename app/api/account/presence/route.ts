import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return Response.json({ error: 'Sign in required.' }, { status: 401 });

    const admin = createSupabaseAdminClient();
    const { error: updateError } = await admin
      .from('profiles')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', data.user.id);
    if (updateError) return Response.json({ error: 'Could not update activity.' }, { status: 503 });

    return Response.json({ lastSeenAt: new Date().toISOString() });
  } catch {
    return Response.json({ error: 'Could not update activity.' }, { status: 503 });
  }
}