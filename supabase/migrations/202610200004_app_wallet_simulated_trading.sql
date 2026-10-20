alter table public.paper_trades
  alter column account_id drop not null;

alter table public.paper_trades
  add column if not exists funding_source text not null default 'demo';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.paper_trades'::regclass
      and conname = 'paper_trades_funding_source_check'
  ) then
    alter table public.paper_trades
      add constraint paper_trades_funding_source_check
      check (funding_source in ('demo', 'app_wallet'));
  end if;
end;
$$;

create table if not exists public.app_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  transaction_type text not null check (transaction_type in ('simulated_stake', 'simulated_payout')),
  amount numeric(18, 2) not null,
  balance_after numeric(18, 2) not null check (balance_after >= 0),
  reference_id uuid not null,
  created_at timestamptz not null default now(),
  unique (transaction_type, reference_id)
);

create index if not exists app_wallet_transactions_user_created_idx
  on public.app_wallet_transactions (user_id, created_at desc);

alter table public.app_wallet_transactions enable row level security;
drop policy if exists "Users read their simulated wallet transactions" on public.app_wallet_transactions;
create policy "Users read their simulated wallet transactions"
  on public.app_wallet_transactions
  for select to authenticated using (auth.uid() = user_id);

alter table public.digit_market_trades
  add column if not exists account_id uuid references public.trading_accounts (id),
  add column if not exists funding_source text not null default 'demo',
  add column if not exists entry_price numeric(24, 10),
  add column if not exists price_precision smallint,
  add column if not exists exit_price numeric(24, 10);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.digit_market_trades'::regclass
      and conname = 'digit_market_trades_funding_source_check'
  ) then
    alter table public.digit_market_trades
      add constraint digit_market_trades_funding_source_check
      check (funding_source in ('demo', 'app_wallet'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.digit_market_trades'::regclass
      and conname = 'digit_market_trades_price_precision_check'
  ) then
    alter table public.digit_market_trades
      add constraint digit_market_trades_price_precision_check
      check (price_precision between 0 and 10);
  end if;
end;
$$;

drop policy if exists "Users can insert their own digit market trades" on public.digit_market_trades;

create or replace function public.place_simulated_trade(
  p_symbol text,
  p_contract_type text,
  p_stake numeric,
  p_entry_quote numeric,
  p_expected_payout numeric,
  p_duration_seconds integer,
  p_funding_source text,
  p_user_id uuid
)
returns table (paper_trade_id uuid, updated_balance numeric, trade_expires_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := p_user_id;
  v_account_id uuid;
  v_balance numeric(18, 2);
  v_trade_id uuid;
  v_expires_at timestamptz;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_symbol !~ '^[A-Z0-9_]{2,32}$'
    or p_contract_type not in ('CALL', 'PUT', 'CALLE', 'PUTE')
    or p_stake <= 0 or p_stake > 10000 or p_stake <> round(p_stake, 2)
    or p_entry_quote <= 0
    or p_expected_payout < p_stake or p_expected_payout > p_stake * 1000
    or p_expected_payout <> round(p_expected_payout, 2)
    or p_duration_seconds not between 15 and 31536000
    or p_funding_source not in ('demo', 'app_wallet') then
    raise exception 'Invalid simulated trade';
  end if;

  if p_funding_source = 'app_wallet' then
    insert into public.app_wallets (user_id, balance_usd)
    values (v_user_id, 0)
    on conflict (user_id) do nothing;

    update public.app_wallets
    set balance_usd = balance_usd - round(p_stake, 2), updated_at = now()
    where user_id = v_user_id and balance_usd >= round(p_stake, 2)
    returning balance_usd into v_balance;
    if not found then raise exception 'Insufficient App Wallet balance'; end if;
  else
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
  end if;

  v_expires_at := now() + make_interval(secs => p_duration_seconds);
  insert into public.paper_trades (
    user_id, account_id, funding_source, symbol, contract_type, stake,
    entry_quote, expected_payout, duration_seconds, expires_at
  ) values (
    v_user_id, v_account_id, p_funding_source, p_symbol, p_contract_type,
    round(p_stake, 2), p_entry_quote, round(p_expected_payout, 2),
    p_duration_seconds, v_expires_at
  ) returning id into v_trade_id;

  if p_funding_source = 'app_wallet' then
    insert into public.app_wallet_transactions (
      user_id, transaction_type, amount, balance_after, reference_id
    ) values (v_user_id, 'simulated_stake', -round(p_stake, 2), v_balance, v_trade_id);
  else
    insert into public.wallet_transactions (
      user_id, account_id, transaction_type, amount, balance_after, reference_id
    ) values (v_user_id, v_account_id, 'demo_stake', -round(p_stake, 2), v_balance, v_trade_id);
  end if;

  return query select v_trade_id, v_balance, v_expires_at;
end;
$$;

revoke all on function public.place_demo_trade(text, text, numeric, numeric, numeric, integer) from public, anon, authenticated;
revoke all on function public.settle_demo_trade(uuid, numeric) from public, anon, authenticated;
revoke all on function public.place_simulated_trade(text, text, numeric, numeric, numeric, integer, text, uuid) from public, anon, authenticated;
grant execute on function public.place_simulated_trade(text, text, numeric, numeric, numeric, integer, text, uuid) to service_role;

create or replace function public.settle_simulated_trade(
  p_trade_id uuid,
  p_exit_quote numeric,
  p_user_id uuid
)
returns table (settled_status text, credited_payout numeric, updated_balance numeric)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_trade public.paper_trades%rowtype;
  v_expires_at timestamptz;
  v_won boolean;
  v_credit numeric(18, 2);
  v_balance numeric(18, 2);
begin
  if p_user_id is null then raise exception 'Authentication required'; end if;
  if p_exit_quote is null or p_exit_quote <= 0 then raise exception 'Invalid exit quote'; end if;

  select * into v_trade
  from public.paper_trades
  where id = p_trade_id and user_id = p_user_id and status = 'open'
  for update;
  if not found then raise exception 'Open simulated trade not found'; end if;

  v_expires_at := v_trade.created_at + make_interval(secs => v_trade.duration_seconds);
  if v_expires_at > now() then raise exception 'Simulated trade has not expired'; end if;

  v_won := case v_trade.contract_type
    when 'CALL' then p_exit_quote > v_trade.entry_quote
    when 'PUT' then p_exit_quote < v_trade.entry_quote
    when 'CALLE' then p_exit_quote >= v_trade.entry_quote
    when 'PUTE' then p_exit_quote <= v_trade.entry_quote
  end;
  v_credit := case when v_won then v_trade.expected_payout else 0 end;

  if v_trade.funding_source = 'app_wallet' then
    update public.app_wallets
    set balance_usd = balance_usd + v_credit, updated_at = now()
    where user_id = p_user_id
    returning balance_usd into v_balance;
    if not found then raise exception 'App Wallet is unavailable'; end if;
  else
    update public.trading_accounts
    set balance = balance + v_credit
    where id = v_trade.account_id and user_id = p_user_id and account_type = 'demo'
    returning balance into v_balance;
    if not found then raise exception 'Demo account unavailable'; end if;
  end if;

  update public.paper_trades
  set status = case when v_won then 'won' else 'lost' end,
      exit_quote = p_exit_quote,
      payout = v_credit,
      settled_at = now(),
      expires_at = v_expires_at
  where id = v_trade.id;

  if v_trade.funding_source = 'app_wallet' then
    if v_credit > 0 then
      insert into public.app_wallet_transactions (
        user_id, transaction_type, amount, balance_after, reference_id
      ) values (p_user_id, 'simulated_payout', v_credit, v_balance, v_trade.id);
    end if;
  else
    insert into public.wallet_transactions (
      user_id, account_id, transaction_type, amount, balance_after, reference_id
    ) values (p_user_id, v_trade.account_id, 'demo_payout', v_credit, v_balance, v_trade.id);
  end if;

  return query select case when v_won then 'won' else 'lost' end, v_credit, v_balance;
end;
$$;

revoke all on function public.settle_simulated_trade(uuid, numeric, uuid) from public, anon, authenticated;
grant execute on function public.settle_simulated_trade(uuid, numeric, uuid) to service_role;

create or replace function public.open_digit_market_trade(
  p_market_symbol text,
  p_market_name text,
  p_contract_type text,
  p_prediction_digit integer,
  p_entry_price numeric,
  p_price_precision integer,
  p_stake numeric,
  p_duration_ticks integer,
  p_funding_source text,
  p_user_id uuid
)
returns table (digit_market_trade_id uuid, updated_balance numeric)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := p_user_id;
  v_account_id uuid;
  v_balance numeric(18, 2);
  v_trade_id uuid;
  v_multiplier numeric(12, 6);
  v_payout numeric(12, 2);
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_market_symbol !~ '^[A-Z0-9_]{2,32}$'
    or char_length(trim(coalesce(p_market_name, ''))) not between 1 and 120
    or p_contract_type not in ('OVER', 'UNDER', 'EVEN', 'ODD', 'MATCH', 'DIFFER')
    or p_entry_price is null or p_entry_price <= 0
    or p_price_precision not between 0 and 10
    or p_stake is null or p_stake < 0.25 or p_stake > 10000 or p_stake <> round(p_stake, 2)
    or p_duration_ticks not between 1 and 100
    or p_funding_source not in ('demo', 'app_wallet') then
    raise exception 'Invalid digit trade';
  end if;

  if p_contract_type in ('EVEN', 'ODD') then
    if p_prediction_digit is not null then raise exception 'Invalid prediction digit'; end if;
  elsif p_prediction_digit is null or p_prediction_digit not between 0 and 9 then
    raise exception 'Invalid prediction digit';
  elsif p_contract_type = 'OVER' and p_prediction_digit = 9 then
    raise exception 'Invalid prediction digit';
  elsif p_contract_type = 'UNDER' and p_prediction_digit = 0 then
    raise exception 'Invalid prediction digit';
  end if;

  v_multiplier := case p_contract_type
    when 'EVEN' then 1.87
    when 'ODD' then 1.87
    when 'MATCH' then 4.47765
    when 'DIFFER' then 1.19
    when 'OVER' then case p_prediction_digit
      when 0 then 1.22 when 1 then 1.33 when 2 then 1.43 when 3 then 1.54
      when 4 then 1.65 when 5 then 1.76 when 6 then 1.93 when 7 then 2.48
      when 8 then 3.97 end
    when 'UNDER' then case p_prediction_digit
      when 1 then 3.97 when 2 then 2.48 when 3 then 1.93 when 4 then 1.76
      when 5 then 1.65 when 6 then 1.54 when 7 then 1.43 when 8 then 1.33
      when 9 then 1.22 end
  end;
  if v_multiplier is null then raise exception 'Invalid digit payout'; end if;
  v_payout := round(p_stake * v_multiplier, 2);

  if p_funding_source = 'app_wallet' then
    insert into public.app_wallets (user_id, balance_usd)
    values (v_user_id, 0)
    on conflict (user_id) do nothing;

    update public.app_wallets
    set balance_usd = balance_usd - round(p_stake, 2), updated_at = now()
    where user_id = v_user_id and balance_usd >= round(p_stake, 2)
    returning balance_usd into v_balance;
    if not found then raise exception 'Insufficient App Wallet balance'; end if;
  else
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
  end if;

  insert into public.digit_market_trades (
    user_id, account_id, funding_source, market_symbol, market_name, contract_type,
    prediction_digit, outcome_digit, entry_price, price_precision, stake, payout,
    profit, duration_ticks, expires_at
  ) values (
    v_user_id, v_account_id, p_funding_source, p_market_symbol, trim(p_market_name),
    p_contract_type, p_prediction_digit, 0, p_entry_price, p_price_precision,
    round(p_stake, 2), v_payout, 0, p_duration_ticks,
    now() + make_interval(secs => p_duration_ticks * 3)
  ) returning id into v_trade_id;

  if p_funding_source = 'app_wallet' then
    insert into public.app_wallet_transactions (
      user_id, transaction_type, amount, balance_after, reference_id
    ) values (v_user_id, 'simulated_stake', -round(p_stake, 2), v_balance, v_trade_id);
  else
    insert into public.wallet_transactions (
      user_id, account_id, transaction_type, amount, balance_after, reference_id
    ) values (v_user_id, v_account_id, 'demo_stake', -round(p_stake, 2), v_balance, v_trade_id);
  end if;

  return query select v_trade_id, v_balance;
end;
$$;

revoke all on function public.open_digit_market_trade(text, text, text, integer, numeric, integer, numeric, integer, text, uuid) from public, anon, authenticated;
grant execute on function public.open_digit_market_trade(text, text, text, integer, numeric, integer, numeric, integer, text, uuid) to service_role;

create or replace function public.settle_digit_market_trade(
  p_trade_id uuid,
  p_exit_price numeric,
  p_price_precision integer,
  p_user_id uuid
)
returns table (settled_status text, credited_payout numeric, updated_balance numeric, outcome_digit integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_trade public.digit_market_trades%rowtype;
  v_outcome_digit integer;
  v_won boolean;
  v_credit numeric(12, 2);
  v_balance numeric(18, 2);
  v_account_id uuid;
begin
  if p_user_id is null then raise exception 'Authentication required'; end if;
  if p_exit_price is null or p_exit_price <= 0 or p_price_precision not between 0 and 10 then
    raise exception 'Invalid exit price';
  end if;

  select * into v_trade
  from public.digit_market_trades
  where id = p_trade_id and user_id = p_user_id and status = 'open'
  for update;
  if not found then raise exception 'Open digit trade not found'; end if;
  if v_trade.expires_at > now() then raise exception 'Digit trade has not expired'; end if;
  v_outcome_digit := mod(
    trunc(abs(round(p_exit_price * power(10::numeric, coalesce(v_trade.price_precision, p_price_precision))))),
    10
  )::integer;
  v_won := case v_trade.contract_type
    when 'OVER' then v_outcome_digit > v_trade.prediction_digit
    when 'UNDER' then v_outcome_digit < v_trade.prediction_digit
    when 'EVEN' then mod(v_outcome_digit, 2) = 0
    when 'ODD' then mod(v_outcome_digit, 2) = 1
    when 'MATCH' then v_outcome_digit = v_trade.prediction_digit
    when 'DIFFER' then v_outcome_digit <> v_trade.prediction_digit
  end;
  v_credit := case when v_won then v_trade.payout else 0 end;

  if v_trade.funding_source = 'app_wallet' then
    update public.app_wallets
    set balance_usd = balance_usd + v_credit, updated_at = now()
    where user_id = p_user_id
    returning balance_usd into v_balance;
    if not found then raise exception 'App Wallet is unavailable'; end if;
    if v_credit > 0 then
      insert into public.app_wallet_transactions (
        user_id, transaction_type, amount, balance_after, reference_id
      ) values (p_user_id, 'simulated_payout', v_credit, v_balance, v_trade.id);
    end if;
  else
    v_account_id := v_trade.account_id;
    if v_account_id is null then
      select id into v_account_id
      from public.trading_accounts
      where user_id = p_user_id and account_type = 'demo' and status = 'active'
      for update;
    end if;

    update public.trading_accounts
    set balance = balance + v_credit
    where id = v_account_id and user_id = p_user_id and account_type = 'demo'
    returning balance into v_balance;
    if not found then raise exception 'Demo account unavailable'; end if;
    insert into public.wallet_transactions (
      user_id, account_id, transaction_type, amount, balance_after, reference_id
    ) values (p_user_id, v_account_id, 'demo_payout', v_credit, v_balance, v_trade.id);
  end if;

  update public.digit_market_trades
  set outcome_digit = v_outcome_digit,
      exit_price = p_exit_price,
      win = v_won,
      payout = v_credit,
      profit = v_credit - v_trade.stake,
      status = case when v_won then 'won' else 'lost' end,
      settled_at = now()
  where id = v_trade.id;

  return query select case when v_won then 'won' else 'lost' end, v_credit, v_balance, v_outcome_digit;
end;
$$;

revoke all on function public.settle_digit_market_trade(uuid, numeric, integer, uuid) from public, anon, authenticated;
grant execute on function public.settle_digit_market_trade(uuid, numeric, integer, uuid) to service_role;

do $$
begin
  if to_regprocedure('public.open_digit_market_trade(text,text,text,integer,numeric,integer,numeric,integer)') is not null then
    execute 'revoke all on function public.open_digit_market_trade(text, text, text, integer, numeric, integer, numeric, integer) from public, anon, authenticated';
  end if;
  if to_regprocedure('public.settle_digit_market_trade(uuid,numeric)') is not null then
    execute 'revoke all on function public.settle_digit_market_trade(uuid, numeric) from public, anon, authenticated';
  end if;
end;
$$;