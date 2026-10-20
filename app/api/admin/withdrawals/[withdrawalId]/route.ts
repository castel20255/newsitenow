import { createSupabaseServerClient } from '@/lib/supabase/server';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ withdrawalId: string }> }
) {
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

    const { withdrawalId } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(withdrawalId)) {
      return Response.json({ error: 'Withdrawal request not found.' }, { status: 404 });
    }

    const body: unknown = await request.json().catch(() => null);
    if (!isRecord(body) || !['approve', 'reject', 'paid'].includes(String(body.action))) {
      return Response.json({ error: 'Choose a valid withdrawal action.' }, { status: 400 });
    }
    const action = String(body.action);
    const payoutReference = typeof body.payoutReference === 'string' ? body.payoutReference.trim() : '';
    if (action === 'paid' && !payoutReference) {
      return Response.json({ error: 'Enter the manual M-Pesa payout reference before marking this request paid.' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('admin_update_wallet_withdrawal', {
      p_withdrawal_id: withdrawalId,
      p_action: action,
      p_admin_note: typeof body.adminNote === 'string' ? body.adminNote.trim() : null,
      p_payout_reference: payoutReference || null,
    });
    if (error) return Response.json({ error: 'Could not update this withdrawal request.' }, { status: 409 });

    const result = Array.isArray(data) ? data[0] : data;
    if (!isRecord(result)) return Response.json({ error: 'Could not confirm the withdrawal update.' }, { status: 503 });
    return Response.json({ id: result.withdrawal_id, status: result.withdrawal_status });
  } catch {
    return Response.json({ error: 'Admin service is unavailable.' }, { status: 503 });
  }
}