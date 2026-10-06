create extension if not exists pgcrypto;

create table if not exists public.digit_market_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  market_symbol text not null,
  market_name text not null,
  contract_type text not null check (contract_type in ('OVER', 'UNDER', 'EVEN', 'ODD', 'MATCH', 'DIFFER')),
  prediction_digit integer check (prediction_digit between 0 and 9),
  outcome_digit integer not null check (outcome_digit between 0 and 9),
  stake numeric(12,2) not null check (stake > 0),
  payout numeric(12,2) not null check (payout >= 0),
  profit numeric(12,2) not null,
  win boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.digit_market_trades enable row level security;

create policy "Users can insert their own digit market trades"
on public.digit_market_trades
for insert
with check (auth.uid() = user_id);

create policy "Users can read their own digit market trades"
on public.digit_market_trades
for select
using (auth.uid() = user_id);

create index if not exists digit_market_trades_user_created_idx
on public.digit_market_trades (user_id, created_at desc);
