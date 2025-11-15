alter table agents add column if not exists owner_account_id text;
create index if not exists agents_owner_idx on agents (owner_account_id);
