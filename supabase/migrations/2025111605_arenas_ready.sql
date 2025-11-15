alter table arenas add column if not exists creator_ready boolean not null default false;
alter table arenas add column if not exists joiner_ready boolean not null default false;
