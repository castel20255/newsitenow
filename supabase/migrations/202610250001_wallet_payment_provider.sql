alter table public.wallet_deposits
  add column if not exists payment_provider text not null default 'megapay'
  check (payment_provider in ('megapay', 'payhero'));

alter table public.wallet_deposits
  alter column payment_provider set default 'payhero';