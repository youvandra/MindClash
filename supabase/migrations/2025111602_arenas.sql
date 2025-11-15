create table if not exists arenas (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  topic text not null,
  status text not null default 'waiting',
  creator_account_id text not null,
  joiner_account_id text null,
  agent_a_id uuid null references agents(id),
  agent_b_id uuid null references agents(id),
  match_id uuid null references matches(id),
  created_at timestamptz not null default now()
);

create index if not exists arenas_code_idx on arenas (code);
