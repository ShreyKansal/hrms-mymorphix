-- Same gap as 20260724070000, same fix, for departments/designations/grades: the Organisation
-- nav link is hidden from non-admins, but these tables' RLS only ever checked tenant_isolation,
-- never role — a non-admin could still insert directly. Split each table's single ALL policy
-- into a read policy (any tenant member) and a write policy (admin only), rather than routing
-- these through RPC functions the way employees/transfers are — plain single-table inserts with
-- an admin-gated RLS policy achieve the same thing with less code for data this simple.

drop policy "tenant_isolation" on public.departments;
create policy "tenant_isolation_select" on public.departments
  for select using (tenant_id = public.get_current_tenant_id());
create policy "tenant_isolation_write" on public.departments
  for all using (
    tenant_id = public.get_current_tenant_id()
    and (select role from public.profiles where id = auth.uid()) = 'admin'
  );

drop policy "tenant_isolation" on public.designations;
create policy "tenant_isolation_select" on public.designations
  for select using (tenant_id = public.get_current_tenant_id());
create policy "tenant_isolation_write" on public.designations
  for all using (
    tenant_id = public.get_current_tenant_id()
    and (select role from public.profiles where id = auth.uid()) = 'admin'
  );

drop policy "tenant_isolation" on public.grades;
create policy "tenant_isolation_select" on public.grades
  for select using (tenant_id = public.get_current_tenant_id());
create policy "tenant_isolation_write" on public.grades
  for all using (
    tenant_id = public.get_current_tenant_id()
    and (select role from public.profiles where id = auth.uid()) = 'admin'
  );
