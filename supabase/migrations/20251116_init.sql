create table if not exists knowledge_packs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  knowledge_pack_id uuid not null references knowledge_packs(id) on delete cascade,
  rating int not null default 1000,
  created_at timestamptz not null default now()
);

create index if not exists agents_rating_idx on agents (rating desc);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  agent_a_id uuid not null references agents(id),
  agent_b_id uuid not null references agents(id),
  rounds jsonb not null,
  judge_scores jsonb not null,
  winner_agent_id uuid null references agents(id),
  created_at timestamptz not null default now()
);

create index if not exists matches_created_at_idx on matches (created_at desc);
