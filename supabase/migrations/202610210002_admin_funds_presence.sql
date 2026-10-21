alter table public.profiles
  add column if not exists last_seen_at timestamptz;

create table if not exists public.admin_wallet_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  admin_user_id uuid not null references auth.users (id),
  previous_balance numeric(18, 2) not null check (previous_balance >= 0),
  new_balance numeric(18, 2) not null check (new_balance >= 0),
  adjustment_amount numeric(18, 2) not null,
  note text,
  created_at timestamptz not null default now(),
  check (note is null or char_length(note) <= 500)
);

create index if not exists admin_wallet_adjustments_user_created_idx
  on public.admin_wallet_adjustments (user_id, created_at desc);

alter table public.admin_wallet_adjustments enable row level security;

create or replace function public.admin_set_app_wallet_balance(
  p_user_id uuid,
  p_balance_usd numeric,
  p_note text default null
)
returns table (
  adjustment_id uuid,
  previous_balance numeric,
  new_balance numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_admin_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_previous_balance numeric(18, 2);
  v_adjustment_id uuid;
begin
  if auth.uid() is null or not exists (
    select 1 from public.site_admins as admin where admin.email = v_admin_email
  ) then
    raise exception 'Admin access required';
  end if;

  if p_user_id is null
    or p_balance_usd is null
    or p_balance_usd < 0
    or p_balance_usd > 1000000000000
    or p_balance_usd <> round(p_balance_usd, 2)
    or char_length(coalesce(p_note, '')) > 500 then
    raise exception 'Enter a valid wallet balance and note';
  end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'User not found';
  end if;

  insert into public.app_wallets (user_id, balance_usd)
  values (p_user_id, 0)
  on conflict (user_id) do nothing;

  select wallet.balance_usd into v_previous_balance
  from public.app_wallets as wallet
  where wallet.user_id = p_user_id
  for update;

  update public.app_wallets as wallet
  set balance_usd = p_balance_usd,
      updated_at = now()
  where wallet.user_id = p_user_id;

  insert into public.admin_wallet_adjustments (
    user_id, admin_user_id, previous_balance, new_balance, adjustment_amount, note
  ) values (
    p_user_id, auth.uid(), v_previous_balance, p_balance_usd,
    p_balance_usd - v_previous_balance, nullif(trim(p_note), '')
  )
  returning id into v_adjustment_id;

  return query select v_adjustment_id, v_previous_balance, p_balance_usd;
end;
$$;

revoke all on function public.admin_set_app_wallet_balance(uuid, numeric, text) from public;
revoke all on function public.admin_set_app_wallet_balance(uuid, numeric, text) from anon;
grant execute on function public.admin_set_app_wallet_balance(uuid, numeric, text) to authenticated;