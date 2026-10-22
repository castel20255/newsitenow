alter table public.digit_market_trades
  add column if not exists entry_epoch bigint;

update public.digit_market_trades
set entry_epoch = floor(extract(epoch from created_at))::bigint
where entry_epoch is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.digit_market_trades'::regclass
      and conname = 'digit_market_trades_entry_epoch_check'
  ) then
    alter table public.digit_market_trades
      add constraint digit_market_trades_entry_epoch_check check (entry_epoch is null or entry_epoch > 0);
  end if;
end;
$$;

create or replace function public.set_digit_market_trade_tick_expiry()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.expires_at := new.created_at;
  return new;
end;
$$;

drop trigger if exists digit_market_trade_tick_expiry on public.digit_market_trades;
create trigger digit_market_trade_tick_expiry
before insert or update of created_at, duration_ticks
on public.digit_market_trades
for each row execute function public.set_digit_market_trade_tick_expiry();

update public.digit_market_trades
set expires_at = created_at
where status = 'open';

create or replace function public.open_digit_market_trade_at_tick(
  p_market_symbol text,
  p_market_name text,
  p_contract_type text,
  p_prediction_digit integer,
  p_entry_price numeric,
  p_price_precision integer,
  p_entry_epoch bigint,
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
  v_trade_id uuid;
  v_balance numeric;
begin
  if p_entry_epoch is null or p_entry_epoch <= 0 then
    raise exception 'Invalid entry tick';
  end if;

  select opened.digit_market_trade_id, opened.updated_balance
  into v_trade_id, v_balance
  from public.open_digit_market_trade(
    p_market_symbol,
    p_market_name,
    p_contract_type,
    p_prediction_digit,
    p_entry_price,
    p_price_precision,
    p_stake,
    p_duration_ticks,
    p_funding_source,
    p_user_id
  ) as opened;

  update public.digit_market_trades
  set entry_epoch = p_entry_epoch,
      expires_at = created_at
  where id = v_trade_id and user_id = p_user_id;

  if not found then raise exception 'Digit trade was not created'; end if;
  return query select v_trade_id, v_balance;
end;
$$;

revoke all on function public.open_digit_market_trade_at_tick(text, text, text, integer, numeric, integer, bigint, numeric, integer, text, uuid) from public, anon, authenticated;
grant execute on function public.open_digit_market_trade_at_tick(text, text, text, integer, numeric, integer, bigint, numeric, integer, text, uuid) to service_role;