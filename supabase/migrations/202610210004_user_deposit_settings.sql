create table if not exists public.user_deposit_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  minimum_deposit_usd numeric(12, 2) not null default 1
    check (minimum_deposit_usd >= 1 and minimum_deposit_usd <= 1000000),
  updated_at timestamptz not null default now()
);

alter table public.user_deposit_settings enable row level security;
