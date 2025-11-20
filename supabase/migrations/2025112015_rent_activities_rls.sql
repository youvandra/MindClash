alter table if exists public.rent_activities enable row level security;

drop policy if exists rent_activities_select_own on public.rent_activities;
create policy rent_activities_select_own on public.rent_activities
  for select
  to authenticated
  using (
    exists (
      select 1 from public.custodial_wallets cw
      where cw.user_id = auth.uid()
        and cw.account_id = public.rent_activities.renter_account_id
    )
  );

