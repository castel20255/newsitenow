-- Repair stale open trade expiries by recomputing them from created_at + duration_seconds.
update public.paper_trades
set expires_at = created_at + make_interval(secs => duration_seconds)
where status = 'open'
  and created_at is not null
  and abs(extract(epoch from (expires_at - (created_at + make_interval(secs => duration_seconds))))) > 1;

create or replace function public.settle_demo_trade(p_trade_id uuid, p_exit_quote numeric)
returns table (settled_status text, credited_payout numeric, updated_balance numeric)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_trade public.paper_trades%rowtype;
  v_expires_at timestamptz;
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

  v_expires_at := v_trade.created_at + make_interval(secs => v_trade.duration_seconds);
  if v_expires_at > now() then raise exception 'Demo trade has not expired'; end if;

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
      settled_at = now(),
      expires_at = v_expires_at
  where id = v_trade.id;

  insert into public.wallet_transactions (user_id, account_id, transaction_type, amount, balance_after, reference_id)
  values (v_user_id, v_trade.account_id, 'demo_payout', v_credit, v_balance, v_trade.id);

  return query select case when v_won then 'won' else 'lost' end, v_credit, v_balance;
end;
$$;

revoke all on function public.settle_demo_trade(uuid, numeric) from public;
grant execute on function public.settle_demo_trade(uuid, numeric) to authenticated;
