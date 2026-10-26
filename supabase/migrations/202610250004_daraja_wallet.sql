alter table public.wallet_deposits
  drop constraint if exists wallet_deposits_payment_provider_check;

alter table public.wallet_deposits
  add constraint wallet_deposits_payment_provider_check
  check (payment_provider in ('megapay', 'payhero', 'daraja'));

alter table public.wallet_deposits
  alter column payment_provider set default 'daraja';

alter table public.wallet_withdrawals
  drop constraint if exists wallet_withdrawals_payout_provider_check;

alter table public.wallet_withdrawals
  add constraint wallet_withdrawals_payout_provider_check
  check (payout_provider is null or payout_provider in ('payhero', 'daraja'));

alter table public.wallet_withdrawals
  add column if not exists payout_callback_token uuid;

create unique index if not exists wallet_withdrawals_payout_callback_token_idx
  on public.wallet_withdrawals (payout_callback_token)
  where payout_callback_token is not null;

create or replace function public.complete_wallet_deposit(
  p_deposit_id uuid,
  p_provider_transaction_id text,
  p_paid_amount_kes numeric,
  p_receipt text
)
returns table (balance_usd numeric, credited_usd numeric, deposit_status text)
language sql
security definer
set search_path = public, pg_temp
as $$
  select * from public.complete_megapay_deposit(
    p_deposit_id,
    p_provider_transaction_id,
    p_paid_amount_kes,
    p_receipt
  );
$$;

create or replace function public.fail_daraja_wallet_withdrawal(p_withdrawal_id uuid)
returns table (withdrawal_id uuid, withdrawal_status text, wallet_balance_usd numeric)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_withdrawal public.wallet_withdrawals%rowtype;
  v_balance numeric(18, 2);
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Service role required';
  end if;

  select * into v_withdrawal
  from public.wallet_withdrawals
  where id = p_withdrawal_id
  for update;
  if not found then raise exception 'Withdrawal request not found'; end if;

  if v_withdrawal.status = 'rejected' and v_withdrawal.payout_status = 'failed' then
    select balance_usd into v_balance
    from public.app_wallets
    where user_id = v_withdrawal.user_id;
    return query select v_withdrawal.id, v_withdrawal.status, v_balance;
    return;
  end if;

  if v_withdrawal.status not in ('pending', 'approved')
    or v_withdrawal.payout_status not in ('initiating', 'queued') then
    raise exception 'Daraja payout is not eligible for automatic refund';
  end if;

  update public.app_wallets
  set balance_usd = balance_usd + v_withdrawal.amount_usd,
      updated_at = now()
  where user_id = v_withdrawal.user_id
  returning balance_usd into v_balance;
  if not found then raise exception 'App Wallet is unavailable'; end if;

  update public.wallet_withdrawals
  set status = 'rejected',
      payout_status = 'failed',
      payout_provider = 'daraja',
      reviewed_at = now()
  where id = p_withdrawal_id;

  return query select v_withdrawal.id, 'rejected'::text, v_balance;
end;
$$;

revoke all on function public.fail_daraja_wallet_withdrawal(uuid) from public;
revoke all on function public.fail_daraja_wallet_withdrawal(uuid) from anon;
revoke all on function public.fail_daraja_wallet_withdrawal(uuid) from authenticated;
grant execute on function public.fail_daraja_wallet_withdrawal(uuid) to service_role;

revoke all on function public.complete_wallet_deposit(uuid, text, numeric, text) from public;
revoke all on function public.complete_wallet_deposit(uuid, text, numeric, text) from anon;
revoke all on function public.complete_wallet_deposit(uuid, text, numeric, text) from authenticated;
grant execute on function public.complete_wallet_deposit(uuid, text, numeric, text) to service_role;