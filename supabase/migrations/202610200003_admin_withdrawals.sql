create table if not exists public.site_admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  amount_usd numeric(18, 2) not null check (amount_usd > 0),
  msisdn text not null check (msisdn ~ '^254[17][0-9]{8}$'),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'paid')),
  admin_note text,
  payout_reference text,
  reviewed_by text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  paid_at timestamptz
);

create index if not exists wallet_withdrawals_user_created_idx
  on public.wallet_withdrawals (user_id, created_at desc);
create index if not exists wallet_withdrawals_status_created_idx
  on public.wallet_withdrawals (status, created_at asc);

alter table public.site_admins enable row level security;
alter table public.wallet_withdrawals enable row level security;

create policy "Admins can read their own admin record" on public.site_admins
  for select to authenticated
  using (email = lower(coalesce(auth.jwt() ->> 'email', '')));

create policy "Users and admins can read wallet withdrawals" on public.wallet_withdrawals
  for select to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.site_admins as admin
      where admin.email = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

create or replace function public.request_wallet_withdrawal(
  p_full_name text,
  p_amount_usd numeric,
  p_msisdn text
)
returns table (withdrawal_id uuid, wallet_balance_usd numeric)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_balance numeric(18, 2);
  v_withdrawal_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if char_length(trim(coalesce(p_full_name, ''))) not between 2 and 120 then
    raise exception 'Enter your full name';
  end if;
  if p_amount_usd is null or p_amount_usd <= 0 or p_amount_usd <> round(p_amount_usd, 2) then
    raise exception 'Enter a valid withdrawal amount';
  end if;
  if p_msisdn !~ '^254[17][0-9]{8}$' then
    raise exception 'Enter a valid Kenyan M-Pesa number';
  end if;

  select balance_usd into v_balance
  from public.app_wallets
  where user_id = v_user_id
  for update;
  if not found then raise exception 'App Wallet is unavailable'; end if;
  if v_balance < p_amount_usd then raise exception 'Insufficient App Wallet balance'; end if;

  update public.app_wallets
  set balance_usd = balance_usd - p_amount_usd,
      updated_at = now()
  where user_id = v_user_id
  returning balance_usd into v_balance;

  insert into public.wallet_withdrawals (user_id, full_name, amount_usd, msisdn)
  values (v_user_id, trim(p_full_name), p_amount_usd, p_msisdn)
  returning id into v_withdrawal_id;

  return query select v_withdrawal_id, v_balance;
end;
$$;

create or replace function public.admin_update_wallet_withdrawal(
  p_withdrawal_id uuid,
  p_action text,
  p_admin_note text default null,
  p_payout_reference text default null
)
returns table (withdrawal_id uuid, withdrawal_status text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_withdrawal public.wallet_withdrawals%rowtype;
begin
  if auth.uid() is null or not exists (
    select 1 from public.site_admins as admin where admin.email = v_email
  ) then
    raise exception 'Admin access required';
  end if;

  select * into v_withdrawal
  from public.wallet_withdrawals
  where id = p_withdrawal_id
  for update;
  if not found then raise exception 'Withdrawal request not found'; end if;

  if p_action = 'approve' and v_withdrawal.status = 'pending' then
    update public.wallet_withdrawals
    set status = 'approved',
        admin_note = nullif(trim(p_admin_note), ''),
        reviewed_by = v_email,
        reviewed_at = now()
    where id = p_withdrawal_id;
  elsif p_action = 'reject' and v_withdrawal.status in ('pending', 'approved') then
    update public.app_wallets
    set balance_usd = balance_usd + v_withdrawal.amount_usd,
        updated_at = now()
    where user_id = v_withdrawal.user_id;
    if not found then raise exception 'App Wallet is unavailable'; end if;

    update public.wallet_withdrawals
    set status = 'rejected',
        admin_note = nullif(trim(p_admin_note), ''),
        reviewed_by = v_email,
        reviewed_at = now()
    where id = p_withdrawal_id;
  elsif p_action = 'paid'
    and v_withdrawal.status = 'approved'
    and char_length(trim(coalesce(p_payout_reference, ''))) between 1 and 120 then
    update public.wallet_withdrawals
    set status = 'paid',
        payout_reference = trim(p_payout_reference),
        admin_note = coalesce(nullif(trim(p_admin_note), ''), admin_note),
        reviewed_by = v_email,
        paid_at = now()
    where id = p_withdrawal_id;
  else
    raise exception 'Invalid withdrawal action for current status';
  end if;

  return query
  select withdrawal.id, withdrawal.status
  from public.wallet_withdrawals as withdrawal
  where withdrawal.id = p_withdrawal_id;
end;
$$;

revoke all on function public.request_wallet_withdrawal(text, numeric, text) from public;
revoke all on function public.request_wallet_withdrawal(text, numeric, text) from anon;
grant execute on function public.request_wallet_withdrawal(text, numeric, text) to authenticated;

revoke all on function public.admin_update_wallet_withdrawal(uuid, text, text, text) from public;
revoke all on function public.admin_update_wallet_withdrawal(uuid, text, text, text) from anon;
grant execute on function public.admin_update_wallet_withdrawal(uuid, text, text, text) to authenticated;