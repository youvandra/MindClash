alter table if exists public.activities enable row level security;

drop policy if exists activities_select_own on public.activities;
create policy activities_select_own on public.activities
  for select
  to authenticated
  using (
    exists (
      select 1 from public.custodial_wallets cw
      where cw.user_id = auth.uid()
        and cw.account_id = public.activities.account_id
    )
  );

-- No insert/update/delete policies for authenticated users.
-- Service role bypasses RLS and is used by the server for writes.

