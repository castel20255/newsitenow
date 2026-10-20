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

  if v_deposit.status not in ('pending', 'expired') then
    raise exception 'Wallet deposit is not verifiable';
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