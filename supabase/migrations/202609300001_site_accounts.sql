create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  full_name text not null,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  country_name text not null,
  phone_e164 text not null,
  terms_accepted_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,24}$')
);

create unique index if not exists profiles_username_unique on public.profiles (lower(username));
create unique index if not exists profiles_phone_unique on public.profiles (phone_e164);

create table if not exists public.trading_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_type text not null check (account_type in ('demo', 'real')),
  currency text not null default 'USD' check (currency = 'USD'),
  balance numeric(18, 2) not null default 0 check (balance >= 0),
  status text not null check (status in ('active', 'provider_required')),
  created_at timestamptz not null default now(),
  unique (user_id, account_type)
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.trading_accounts (id) on delete cascade,
  transaction_type text not null check (transaction_type in ('demo_credit', 'demo_stake', 'demo_payout')),
  amount numeric(18, 2) not null,
  balance_after numeric(18, 2) not null check (balance_after >= 0),
  reference_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.paper_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.trading_accounts (id) on delete cascade,
  symbol text not null,
  contract_type text not null check (contract_type in ('CALL', 'PUT', 'CALLE', 'PUTE')),
  stake numeric(18, 2) not null check (stake > 0),
  entry_quote numeric(24, 10) not null check (entry_quote > 0),
  expected_payout numeric(18, 2) not null check (expected_payout >= stake),
  duration_seconds integer not null check (duration_seconds between 1 and 31536000),
  expires_at timestamptz not null,
  status text not null default 'open' check (status in ('open', 'won', 'lost')),
  exit_quote numeric(24, 10),
  payout numeric(18, 2) not null default 0 check (payout >= 0),
  created_at timestamptz not null default now(),
  settled_at timestamptz
);

create index if not exists paper_trades_user_created_idx on public.paper_trades (user_id, created_at desc);
create index if not exists paper_trades_open_expiry_idx on public.paper_trades (user_id, expires_at) where status = 'open';

alter table public.profiles enable row level security;
alter table public.trading_accounts enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.paper_trades enable row level security;

create policy "Users read their profile" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "Users read their trading accounts" on public.trading_accounts
  for select to authenticated using (auth.uid() = user_id);
create policy "Users read their wallet transactions" on public.wallet_transactions
  for select to authenticated using (auth.uid() = user_id);
create policy "Users read their paper trades" on public.paper_trades
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.create_site_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_username text := lower(trim(new.raw_user_meta_data ->> 'username'));
  v_full_name text := trim(new.raw_user_meta_data ->> 'full_name');
  v_country_code text := upper(trim(new.raw_user_meta_data ->> 'country_code'));
  v_country_name text := trim(new.raw_user_meta_data ->> 'country_name');
  v_phone_e164 text := trim(new.raw_user_meta_data ->> 'phone_e164');
  v_terms_accepted boolean := coalesce((new.raw_user_meta_data ->> 'terms_accepted')::boolean, false);
  v_demo_account_id uuid;
  v_real_account_id uuid;
begin
  if v_username !~ '^[a-z0-9_]{3,24}$'
    or length(v_full_name) < 2
    or v_country_code !~ '^[A-Z]{2}$'
    or v_country_name = ''
    or v_phone_e164 !~ '^\+[1-9][0-9]{7,14}$'
    or not v_terms_accepted then
    raise exception 'Invalid signup profile';
  end if;

  insert into public.profiles (id, username, full_name, country_code, country_name, phone_e164, terms_accepted_at)
  values (new.id, v_username, v_full_name, v_country_code, v_country_name, v_phone_e164, now());

  insert into public.trading_accounts (user_id, account_type, balance, status)
  values (new.id, 'demo', 10000, 'active')
  returning id into v_demo_account_id;

  insert into public.trading_accounts (user_id, account_type, balance, status)
  values (new.id, 'real', 0, 'provider_required')
  returning id into v_real_account_id;

  insert into public.wallet_transactions (user_id, account_id, transaction_type, amount, balance_after)
  values (new.id, v_demo_account_id, 'demo_credit', 10000, 10000);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_site_profile on auth.users;
create trigger on_auth_user_created_site_profile
  after insert on auth.users
  for each row execute function public.create_site_profile();

create or replace function public.place_demo_trade(
  p_symbol text,
  p_contract_type text,
  p_stake numeric,
  p_entry_quote numeric,
  p_expected_payout numeric,
  p_duration_seconds integer
)
returns table (paper_trade_id uuid, updated_balance numeric, trade_expires_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_account_id uuid;
  v_balance numeric(18, 2);
  v_trade_id uuid;
  v_expires_at timestamptz;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_symbol !~ '^[A-Z0-9_]{2,32}$'
    or p_contract_type not in ('CALL', 'PUT', 'CALLE', 'PUTE')
    or p_stake <= 0 or p_stake > 10000
    or p_entry_quote <= 0
    or p_expected_payout < p_stake
    or p_duration_seconds not between 1 and 31536000 then
    raise exception 'Invalid demo trade';
  end if;

  select id into v_account_id
  from public.trading_accounts
  where user_id = v_user_id and account_type = 'demo' and status = 'active'
  for update;
  if v_account_id is null then raise exception 'Demo account unavailable'; end if;

  update public.trading_accounts
  set balance = balance - round(p_stake, 2)
  where id = v_account_id and user_id = v_user_id and balance >= round(p_stake, 2)
  returning balance into v_balance;
  if not found then raise exception 'Insufficient demo balance'; end if;

  v_expires_at := now() + make_interval(secs => p_duration_seconds);
  insert into public.paper_trades (
    user_id, account_id, symbol, contract_type, stake, entry_quote,
    expected_payout, duration_seconds, expires_at
  ) values (
    v_user_id, v_account_id, p_symbol, p_contract_type, round(p_stake, 2),
    p_entry_quote, round(p_expected_payout, 2), p_duration_seconds, v_expires_at
  ) returning id into v_trade_id;

  insert into public.wallet_transactions (user_id, account_id, transaction_type, amount, balance_after, reference_id)
  values (v_user_id, v_account_id, 'demo_stake', -round(p_stake, 2), v_balance, v_trade_id);

  return query select v_trade_id, v_balance, v_expires_at;
end;
$$;

create or replace function public.settle_demo_trade(p_trade_id uuid, p_exit_quote numeric)
returns table (settled_status text, credited_payout numeric, updated_balance numeric)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_trade public.paper_trades%rowtype;
  v_won boolean;
  v_credit numeric(18, 2);
  v_balance numeric(18, 2);
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_exit_quote <= 0 then raise exception 'Invalid exit quote'; end if;

  select * into v_trade
  from public.paper_trades
  where id = p_trade_id and user_id = v_user_id and status = 'open'
  for update;
  if not found then raise exception 'Open demo trade not found'; end if;
  if v_trade.expires_at > now() then raise exception 'Demo trade has not expired'; end if;

  v_won := case v_trade.contract_type
    when 'CALL' then p_exit_quote > v_trade.entry_quote
    when 'PUT' then p_exit_quote < v_trade.entry_quote
    when 'CALLE' then p_exit_quote >= v_trade.entry_quote
    when 'PUTE' then p_exit_quote <= v_trade.entry_quote
  end;
  v_credit := case when v_won then v_trade.expected_payout else 0 end;

  update public.trading_accounts
  set balance = balance + v_credit
  where id = v_trade.account_id and user_id = v_user_id and account_type = 'demo'
  returning balance into v_balance;
  if not found then raise exception 'Demo account unavailable'; end if;

  update public.paper_trades
  set status = case when v_won then 'won' else 'lost' end,
      exit_quote = p_exit_quote,
      payout = v_credit,
      settled_at = now()
  where id = v_trade.id;

  insert into public.wallet_transactions (user_id, account_id, transaction_type, amount, balance_after, reference_id)
  values (v_user_id, v_trade.account_id, 'demo_payout', v_credit, v_balance, v_trade.id);

  return query select case when v_won then 'won' else 'lost' end, v_credit, v_balance;
end;
$$;

revoke all on function public.place_demo_trade(text, text, numeric, numeric, numeric, integer) from public;
revoke all on function public.settle_demo_trade(uuid, numeric) from public;
grant execute on function public.place_demo_trade(text, text, numeric, numeric, numeric, integer) to authenticated;
grant execute on function public.settle_demo_trade(uuid, numeric) to authenticated;