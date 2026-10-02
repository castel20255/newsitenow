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
    or p_duration_seconds not between 15 and 31536000 then
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

revoke all on function public.place_demo_trade(text, text, numeric, numeric, numeric, integer) from public;
grant execute on function public.place_demo_trade(text, text, numeric, numeric, numeric, integer) to authenticated;