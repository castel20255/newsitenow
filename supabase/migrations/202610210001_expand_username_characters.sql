alter table public.profiles
  drop constraint if exists profiles_username_format;

alter table public.profiles
  add constraint profiles_username_format
  check (char_length(username) between 3 and 24 and username !~ '[[:cntrl:]]');

create or replace function public.create_site_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_username text := trim(new.raw_user_meta_data ->> 'username');
  v_full_name text := trim(new.raw_user_meta_data ->> 'full_name');
  v_country_code text := upper(trim(new.raw_user_meta_data ->> 'country_code'));
  v_country_name text := trim(new.raw_user_meta_data ->> 'country_name');
  v_phone_e164 text := trim(new.raw_user_meta_data ->> 'phone_e164');
  v_terms_accepted boolean := coalesce((new.raw_user_meta_data ->> 'terms_accepted')::boolean, false);
  v_demo_account_id uuid;
  v_real_account_id uuid;
begin
  if char_length(v_username) not between 3 and 24
    or v_username ~ '[[:cntrl:]]'
    or length(v_full_name) < 2
    or v_country_code !~ '^[A-Z]{2}$'
    or v_country_name = ''
    or v_phone_e164 !~ '^\+[1-9][0-9]{7,14}$'
    or not v_terms_accepted then
    raise exception 'Invalid signup profile';
  end if;

  insert into public.profiles (id, username, full_name, country_code, country_name, phone_e164, terms_accepted_at)
  values (new.id, v_username, v_full_name, v_country_code, v_country_name, v_phone_e164, now());

  insert into public.trading_accounts (user_id, account_type, balance, status)
  values (new.id, 'demo', 10000, 'active')
  returning id into v_demo_account_id;

  insert into public.trading_accounts (user_id, account_type, balance, status)
  values (new.id, 'real', 0, 'provider_required')
  returning id into v_real_account_id;

  insert into public.wallet_transactions (user_id, account_id, transaction_type, amount, balance_after)
  values (new.id, v_demo_account_id, 'demo_credit', 10000, 10000);

  return new;
end;
$$;