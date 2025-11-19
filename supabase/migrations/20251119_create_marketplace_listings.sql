create table if not exists public.marketplace_listings (
  id uuid primary key default uuid_generate_v4(),
  knowledge_pack_id uuid not null references public.knowledge_packs(id) on delete cascade,
  owner_account_id text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

