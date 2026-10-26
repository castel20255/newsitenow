alter table public.wallet_deposits
  add column if not exists provider_result_code text,
  add column if not exists provider_result_description text;