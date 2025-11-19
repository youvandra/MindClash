alter table public.custodial_wallets
  add column if not exists private_key text,
  add column if not exists public_key text;

