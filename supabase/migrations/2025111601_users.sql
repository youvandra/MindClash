create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  account_id text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists users_account_id_idx on users (account_id);
