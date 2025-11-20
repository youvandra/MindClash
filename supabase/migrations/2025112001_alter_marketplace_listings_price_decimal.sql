-- Convert marketplace_listings price fields to decimal to support fractional COK
-- Safe to run multiple times; constraints are added only if missing

begin;

alter table if exists public.marketplace_listings
  alter column price type numeric(18,8) using price::numeric,
  alter column price set default 0;

alter table if exists public.marketplace_listings
  alter column price_per_use type numeric(18,8) using price_per_use::numeric,
  alter column price_per_use set default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_listings_price_nonnegative'
      and conrelid = 'public.marketplace_listings'::regclass
  ) then
    alter table public.marketplace_listings
      add constraint marketplace_listings_price_nonnegative check (price >= 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_listings_price_per_use_nonnegative'
      and conrelid = 'public.marketplace_listings'::regclass
  ) then
    alter table public.marketplace_listings
      add constraint marketplace_listings_price_per_use_nonnegative check (price_per_use >= 0);
  end if;
end $$;

commit;

