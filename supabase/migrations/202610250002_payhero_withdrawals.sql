alter table public.wallet_withdrawals
  add column if not exists payout_provider text
    check (payout_provider is null or payout_provider = 'payhero'),
  add column if not exists payout_request_reference text,
  add column if not exists payout_provider_reference text,
  add column if not exists payout_provider_request_id text,
  add column if not exists payout_amount_kes integer
    check (payout_amount_kes is null or payout_amount_kes > 0),
  add column if not exists payout_status text not null default 'not_started'
    check (payout_status in ('not_started', 'initiating', 'queued', 'failed', 'success'));

create unique index if not exists wallet_withdrawals_payout_request_reference_idx
  on public.wallet_withdrawals (payout_request_reference)
  where payout_request_reference is not null;

create or replace function public.admin_update_wallet_withdrawal(
  p_withdrawal_id uuid,
  p_action text,
  p_admin_note text default null,
  p_payout_reference text default null
)
returns table (withdrawal_id uuid, withdrawal_status text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_withdrawal public.wallet_withdrawals%rowtype;
begin
  if auth.uid() is null or not exists (
    select 1 from public.site_admins as admin where admin.email = v_email
  ) then
    raise exception 'Admin access required';
  end if;

  select * into v_withdrawal
  from public.wallet_withdrawals
  where id = p_withdrawal_id
  for update;
  if not found then raise exception 'Withdrawal request not found'; end if;

  if p_action = 'approve' and v_withdrawal.status = 'pending' then
    update public.wallet_withdrawals
    set status = 'approved',
        admin_note = nullif(trim(p_admin_note), ''),
        reviewed_by = v_email,
        reviewed_at = now()
    where id = p_withdrawal_id;
  elsif p_action = 'reject' and v_withdrawal.status in ('pending', 'approved') then
    if v_withdrawal.payout_status in ('initiating', 'queued', 'success') then
      raise exception 'A PayHero payout is already in progress or completed';
    end if;

    update public.app_wallets
    set balance_usd = balance_usd + v_withdrawal.amount_usd,
        updated_at = now()
    where user_id = v_withdrawal.user_id;
    if not found then raise exception 'App Wallet is unavailable'; end if;

    update public.wallet_withdrawals
    set status = 'rejected',
        admin_note = nullif(trim(p_admin_note), ''),
        reviewed_by = v_email,
        reviewed_at = now()
    where id = p_withdrawal_id;
  elsif p_action = 'paid'
    and v_withdrawal.status = 'approved'
    and char_length(trim(coalesce(p_payout_reference, ''))) between 1 and 120 then
    update public.wallet_withdrawals
    set status = 'paid',
        payout_reference = trim(p_payout_reference),
        admin_note = coalesce(nullif(trim(p_admin_note), ''), admin_note),
        reviewed_by = v_email,
        paid_at = now()
    where id = p_withdrawal_id;
  else
    raise exception 'Invalid withdrawal action for current status';
  end if;

  return query
  select withdrawal.id, withdrawal.status
  from public.wallet_withdrawals as withdrawal
  where withdrawal.id = p_withdrawal_id;
end;
$$;

revoke all on function public.admin_update_wallet_withdrawal(uuid, text, text, text) from public;
revoke all on function public.admin_update_wallet_withdrawal(uuid, text, text, text) from anon;
grant execute on function public.admin_update_wallet_withdrawal(uuid, text, text, text) to authenticated;