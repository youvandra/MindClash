create extension if not exists pgcrypto;

create table if not exists public.custodial_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'google',
  email text,
  account_id text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists custodial_wallets_user_id_idx on public.custodial_wallets(user_id);

