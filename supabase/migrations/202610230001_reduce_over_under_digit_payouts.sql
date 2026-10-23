create or replace function public.reduce_over_under_digit_trade_payout()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.contract_type in ('OVER', 'UNDER') then
    new.payout := round(new.payout - new.stake * 0.07, 2);
  end if;
  return new;
end;
$$;

drop trigger if exists digit_market_trade_reduce_over_under_payout on public.digit_market_trades;
create trigger digit_market_trade_reduce_over_under_payout
before insert on public.digit_market_trades
for each row execute function public.reduce_over_under_digit_trade_payout();
