create table if not exists public.app_wallets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance_usd numeric(18, 2) not null default 0 check (balance_usd >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_usd numeric(18, 2) not null check (amount_usd >= 2),
  amount_kes integer not null check (amount_kes > 0),
  fx_rate numeric(12, 2) not null default 131.21 check (fx_rate = 131.21),
  msisdn text not null,
  reference text not null unique,
  provider_request_id text unique,
  provider_transaction_id text unique,
  receipt text,
  credited_usd numeric(18, 2),
  status text not null default 'initiating'
    check (status in ('initiating', 'pending', 'completed', 'failed', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists wallet_deposits_user_created_idx
  on public.wallet_deposits (user_id, created_at desc);

create unique index if not exists wallet_deposits_one_open_per_user_idx
  on public.wallet_deposits (user_id)
  where status in ('initiating', 'pending');

alter table public.app_wallets enable row level security;
alter table public.wallet_deposits enable row level security;

create policy "Users read their app wallet" on public.app_wallets
  for select to authenticated using (auth.uid() = user_id);
create policy "Users read their wallet deposits" on public.wallet_deposits
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.complete_megapay_deposit(
  p_deposit_id uuid,
  p_provider_transaction_id text,
  p_paid_amount_kes numeric,
  p_receipt text
)
returns table (balance_usd numeric, credited_usd numeric, deposit_status text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deposit public.wallet_deposits%rowtype;
  v_balance numeric(18, 2);
  v_credit numeric(18, 2);
begin
  if p_provider_transaction_id is null or btrim(p_provider_transaction_id) = '' then
    raise exception 'Provider transaction ID is required';
  end if;

  select * into v_deposit
  from public.wallet_deposits
  where id = p_deposit_id
  for update;
  if not found then raise exception 'Wallet deposit not found'; end if;

  if p_paid_amount_kes <> v_deposit.amount_kes then
    raise exception 'Paid amount does not match the wallet deposit';
  end if;

  if v_deposit.status = 'completed' then
    if v_deposit.provider_transaction_id <> p_provider_transaction_id then
      raise exception 'Wallet deposit was completed with another transaction';
    end if;
    select wallet.balance_usd into v_balance
    from public.app_wallets as wallet
    where wallet.user_id = v_deposit.user_id;
    return query select v_balance, v_deposit.credited_usd, v_deposit.status;
    return;
  end if;

  if v_deposit.status <> 'pending' then
    raise exception 'Wallet deposit is not pending';
  end if;

  v_credit := v_deposit.amount_usd;
  if v_credit < 2 then raise exception 'Verified wallet credit is below the minimum'; end if;

  insert into public.app_wallets (user_id, balance_usd)
  values (v_deposit.user_id, 0)
  on conflict (user_id) do nothing;

  update public.app_wallets as wallet
  set balance_usd = wallet.balance_usd + v_credit,
      updated_at = now()
  where wallet.user_id = v_deposit.user_id
  returning wallet.balance_usd into v_balance;

  update public.wallet_deposits as deposit
  set status = 'completed',
      provider_transaction_id = p_provider_transaction_id,
      receipt = nullif(btrim(p_receipt), ''),
      credited_usd = v_credit,
      updated_at = now(),
      completed_at = now()
  where deposit.id = v_deposit.id;

  return query select v_balance, v_credit, 'completed'::text;
end;
$$;

revoke all on function public.complete_megapay_deposit(uuid, text, numeric, text) from public;
revoke all on function public.complete_megapay_deposit(uuid, text, numeric, text) from anon;
revoke all on function public.complete_megapay_deposit(uuid, text, numeric, text) from authenticated;
grant execute on function public.complete_megapay_deposit(uuid, text, numeric, text) to service_role;