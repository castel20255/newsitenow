import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface UserRecord {
  id: string;
  email?: string;
  last_sign_in_at?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user?.email) return { response: Response.json({ error: 'Sign in required.' }, { status: 401 }) };

  const { data: adminRecord, error: adminError } = await supabase
    .from('site_admins')
    .select('email')
    .eq('email', auth.user.email.toLowerCase())
    .maybeSingle();
  if (adminError || !adminRecord) return { response: Response.json({ error: 'Admin access required.' }, { status: 403 }) };
  return { supabase, user: auth.user };
}

export async function GET() {
  try {
    const access = await requireAdmin();
    if ('response' in access) return access.response;

    const admin = createSupabaseAdminClient();
    const userRecords: UserRecord[] = [];
    const perPage = 100;
    for (let page = 1; ; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) return Response.json({ error: 'Could not load users.' }, { status: 503 });
      userRecords.push(...data.users.map(user => ({
        id: user.id,
        email: user.email ?? '',
        last_sign_in_at: user.last_sign_in_at,
      })));
      if (data.users.length < perPage) break;
    }

    const [profilesResult, accountsResult, walletsResult] = await Promise.all([
      admin.from('profiles').select('id, username, full_name, last_seen_at'),
      admin.from('trading_accounts').select('user_id, account_type, balance'),
      admin.from('app_wallets').select('user_id, balance_usd'),
    ]);
    if (profilesResult.error || accountsResult.error || walletsResult.error) {
      return Response.json({ error: 'Could not load user balances.' }, { status: 503 });
    }

    const profiles = new Map((profilesResult.data ?? []).map(profile => [profile.id, profile]));
    const demoBalances = new Map((accountsResult.data ?? [])
      .filter(account => account.account_type === 'demo')
      .map(account => [account.user_id, Number(account.balance)]));
    const realBalances = new Map((accountsResult.data ?? [])
      .filter(account => account.account_type === 'real')
      .map(account => [account.user_id, Number(account.balance)]));
    const siteBalances = new Map((walletsResult.data ?? [])
      .map(wallet => [wallet.user_id, Number(wallet.balance_usd)]));

    const users = userRecords.map(user => {
      const profile = profiles.get(user.id);
      return {
        id: user.id,
        email: user.email ?? '',
        username: profile?.username ?? '',
        fullName: profile?.full_name ?? '',
        lastSeenAt: profile?.last_seen_at ?? user.last_sign_in_at ?? null,
        demoBalance: demoBalances.get(user.id) ?? 0,
        siteWalletBalance: siteBalances.get(user.id) ?? 0,
        realBalance: realBalances.get(user.id) ?? 0,
      };
    }).sort((left, right) => (left.fullName || left.email).localeCompare(right.fullName || right.email));

    return Response.json({ users });
  } catch {
    return Response.json({ error: 'Funds management service is unavailable.' }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await requireAdmin();
    if ('response' in access) return access.response;

    const body: unknown = await request.json().catch(() => null);
    if (!isRecord(body) || typeof body.userId !== 'string' || typeof body.balance !== 'string') {
      return Response.json({ error: 'Enter a valid user and balance.' }, { status: 400 });
    }
    if (!/^[0-9a-f-]{36}$/i.test(body.userId) || !/^\d+(?:\.\d{1,2})?$/.test(body.balance)) {
      return Response.json({ error: 'Enter a valid non-negative balance with up to two decimal places.' }, { status: 400 });
    }
    const balance = Number(body.balance);
    const note = typeof body.note === 'string' ? body.note.trim() : '';
    if (!Number.isFinite(balance) || balance > 1_000_000_000_000 || note.length > 500) {
      return Response.json({ error: 'Balance or note is outside the allowed range.' }, { status: 400 });
    }

    const { data, error } = await access.supabase.rpc('admin_set_app_wallet_balance', {
      p_user_id: body.userId,
      p_balance_usd: balance,
      p_note: note || null,
    });
    if (error) return Response.json({ error: 'Could not save the Site Wallet balance.' }, { status: 409 });

    const result = Array.isArray(data) ? data[0] : data;
    if (!isRecord(result)) return Response.json({ error: 'Could not confirm the balance update.' }, { status: 503 });
    return Response.json({
      adjustmentId: result.adjustment_id,
      previousBalance: Number(result.previous_balance),
      newBalance: Number(result.new_balance),
    });
  } catch {
    return Response.json({ error: 'Funds management service is unavailable.' }, { status: 503 });
  }
}