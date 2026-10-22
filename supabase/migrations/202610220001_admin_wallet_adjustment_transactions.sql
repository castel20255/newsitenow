alter table public.app_wallet_transactions
  drop constraint if exists app_wallet_transactions_transaction_type_check;

alter table public.app_wallet_transactions
  add constraint app_wallet_transactions_transaction_type_check
  check (transaction_type in (
    'simulated_stake',
    'simulated_payout',
    'admin_deposit',
    'admin_withdrawal'
  ));

create or replace function public.admin_set_app_wallet_balance(
  p_user_id uuid,
  p_balance_usd numeric,
  p_note text default null
)
returns table (
  adjustment_id uuid,
  previous_balance numeric,
  new_balance numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_admin_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_previous_balance numeric(18, 2);
  v_adjustment_id uuid;
  v_adjustment_amount numeric(18, 2);
begin
  if auth.uid() is null or not exists (
    select 1 from public.site_admins as admin where admin.email = v_admin_email
  ) then
    raise exception 'Admin access required';
  end if;

  if p_user_id is null
    or p_balance_usd is null
    or p_balance_usd < 0
    or p_balance_usd > 1000000000000
    or p_balance_usd <> round(p_balance_usd, 2)
    or char_length(coalesce(p_note, '')) > 500 then
    raise exception 'Enter a valid wallet balance and note';
  end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'User not found';
  end if;

  insert into public.app_wallets (user_id, balance_usd)
  values (p_user_id, 0)
  on conflict (user_id) do nothing;

  select wallet.balance_usd into v_previous_balance
  from public.app_wallets as wallet
  where wallet.user_id = p_user_id
  for update;

  v_adjustment_amount := p_balance_usd - v_previous_balance;

  update public.app_wallets as wallet
  set balance_usd = p_balance_usd,
      updated_at = now()
  where wallet.user_id = p_user_id;

  insert into public.admin_wallet_adjustments (
    user_id, admin_user_id, previous_balance, new_balance, adjustment_amount, note
  ) values (
    p_user_id, auth.uid(), v_previous_balance, p_balance_usd,
    v_adjustment_amount, nullif(trim(p_note), '')
  )
  returning id into v_adjustment_id;

  if v_adjustment_amount > 0 then
    insert into public.app_wallet_transactions (
      user_id, transaction_type, amount, balance_after, reference_id
    ) values (
      p_user_id, 'admin_deposit', v_adjustment_amount, p_balance_usd, v_adjustment_id
    );
  elsif v_adjustment_amount < 0 then
    insert into public.app_wallet_transactions (
      user_id, transaction_type, amount, balance_after, reference_id
    ) values (
      p_user_id, 'admin_withdrawal', v_adjustment_amount, p_balance_usd, v_adjustment_id
    );
  end if;

  return query select v_adjustment_id, v_previous_balance, p_balance_usd;
end;
$$;

revoke all on function public.admin_set_app_wallet_balance(uuid, numeric, text) from public;
revoke all on function public.admin_set_app_wallet_balance(uuid, numeric, text) from anon;
grant execute on function public.admin_set_app_wallet_balance(uuid, numeric, text) to authenticated;