create extension if not exists pgcrypto;

create table if not exists public.rent_activities (
  id uuid primary key default gen_random_uuid(),
  renter_account_id text not null,
  owner_account_id text not null,
  listing_id text not null,
  title text,
  minutes integer not null default 0,
  total_amount integer not null default 0,
  transaction_ids text[] not null default '{}',
  network text,
  created_at timestamptz not null default now()
);

create index if not exists rent_activities_renter_idx on public.rent_activities(renter_account_id);
create index if not exists rent_activities_created_at_idx on public.rent_activities(created_at);

