drop function if exists public.request_wallet_withdrawal(text, numeric, text);

create function public.request_wallet_withdrawal(
  p_full_name text,
  p_amount_usd numeric,
  p_msisdn text
)
returns table (
  withdrawal_id uuid,
  wallet_balance_usd numeric,
  withdrawal_status text,
  rejection_reason text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_balance numeric(18, 2);
  v_minimum_withdrawal numeric(12, 2);
  v_deposit_volume numeric(18, 2);
  v_bonus_volume numeric(18, 2);
  v_trade_volume numeric(18, 2);
  v_withdrawal_id uuid;
  v_rejection_reason text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if char_length(trim(coalesce(p_full_name, ''))) not between 2 and 120 then
    raise exception 'Enter your full name';
  end if;
  if p_amount_usd is null or p_amount_usd <= 0 or p_amount_usd <> round(p_amount_usd, 2) then
    raise exception 'Enter a valid withdrawal amount';
  end if;

  select greatest(20, coalesce((
    select setting.minimum_withdrawal_usd
    from public.user_withdrawal_settings as setting
    where setting.user_id = v_user_id
  ), 20))
  into v_minimum_withdrawal;
  if p_amount_usd < v_minimum_withdrawal then
    raise exception 'Minimum withdrawal is $% USD', to_char(v_minimum_withdrawal, 'FM999999999990.00');
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

  select coalesce(sum(coalesce(deposit.credited_usd, deposit.amount_usd)), 0)
  into v_deposit_volume
  from public.wallet_deposits as deposit
  where deposit.user_id = v_user_id
    and deposit.status = 'completed';

  select coalesce(sum(transaction.amount), 0)
  into v_bonus_volume
  from public.app_wallet_transactions as transaction
  where transaction.user_id = v_user_id
    and transaction.transaction_type = 'welcome_bonus'
    and transaction.amount > 0;

  select coalesce(sum(-transaction.amount), 0)
  into v_trade_volume
  from public.app_wallet_transactions as transaction
  where transaction.user_id = v_user_id
    and transaction.transaction_type = 'simulated_stake'
    and transaction.amount < 0;

  if v_trade_volume < v_deposit_volume + v_bonus_volume then
    v_rejection_reason := format(
      'Withdrawal auto-rejected: Real Wallet trade volume is $%s, but your completed deposits and bonuses total $%s. Place additional Real Wallet trades to meet this requirement before requesting another withdrawal. No funds were deducted.',
      to_char(v_trade_volume, 'FM999999999990.00'),
      to_char(v_deposit_volume + v_bonus_volume, 'FM999999999990.00')
    );

    insert into public.wallet_withdrawals (
      user_id, full_name, amount_usd, msisdn, status, admin_note, reviewed_at
    ) values (
      v_user_id, trim(p_full_name), p_amount_usd, p_msisdn, 'rejected', v_rejection_reason, now()
    )
    returning id into v_withdrawal_id;

    return query select v_withdrawal_id, v_balance, 'rejected'::text, v_rejection_reason;
    return;
  end if;

  update public.app_wallets
  set balance_usd = balance_usd - p_amount_usd,
      updated_at = now()
  where user_id = v_user_id
  returning balance_usd into v_balance;

  insert into public.wallet_withdrawals (user_id, full_name, amount_usd, msisdn)
  values (v_user_id, trim(p_full_name), p_amount_usd, p_msisdn)
  returning id into v_withdrawal_id;

  return query select v_withdrawal_id, v_balance, 'pending'::text, null::text;
end;
$$;

revoke all on function public.request_wallet_withdrawal(text, numeric, text) from public;
revoke all on function public.request_wallet_withdrawal(text, numeric, text) from anon;
grant execute on function public.request_wallet_withdrawal(text, numeric, text) to authenticated;
