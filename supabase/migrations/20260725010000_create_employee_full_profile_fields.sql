-- Add Employee is being rebuilt from a 7-field Modal into a full-page wizard
-- (docs/build/03-ui-patterns.md §2 — the Modal only ever exposed a fraction of what
-- `employees` already has columns for). create_employee() needs to accept the rest of the
-- Personal/Contact/Government-ID field group in the same atomic call, not a follow-up
-- .update() — the RPC is the one place that checks "caller is admin" (RLS on `employees`
-- itself is tenant-only, no role check, per 20260724070000's own comment), so a second
-- unguarded write path would quietly reopen that gap for a non-admin with an employee id.
--
-- Also fixes a real PRD deviation, not just an addition: docs/hrms-prd/modules/
-- 01-core-hr-employee-information.md §6 step 5 says a directly-entered employee is "saved in
-- 'Active' status" — 'draft' (per §14's table) is specifically for records created via the
-- Module 3 onboarding flow, which doesn't exist yet. Every employee created through this RPC
-- today is direct entry, so hardcoding 'draft' was always wrong for the only caller that
-- exists, not a deliberate choice — nothing anywhere transitions 'draft' to 'active' later,
-- so employees created via the old modal are stuck showing a permanent grey status badge.
create or replace function public.create_employee(
  p_legal_entity_id uuid,
  p_legal_name text,
  p_joining_date date,
  p_employment_type text,
  p_personal_email text default null,
  p_department_id uuid default null,
  p_designation_id uuid default null,
  p_grade_id uuid default null,
  p_manager_id uuid default null,
  p_date_of_birth date default null,
  p_gender text default null,
  p_pan_number text default null,
  p_personal_phone text default null
)
returns public.employees
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant_id uuid := public.get_current_tenant_id();
  v_caller_role text;
  v_employee public.employees;
begin
  if v_tenant_id is null then
    raise exception 'No tenant context for the current user';
  end if;

  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role is distinct from 'admin' then
    raise exception 'Only admins can create employees';
  end if;

  if not exists (select 1 from public.legal_entities where id = p_legal_entity_id and tenant_id = v_tenant_id) then
    raise exception 'legal_entity_id does not belong to the current tenant';
  end if;
  if p_department_id is not null and not exists (select 1 from public.departments where id = p_department_id and tenant_id = v_tenant_id) then
    raise exception 'department_id does not belong to the current tenant';
  end if;
  if p_designation_id is not null and not exists (select 1 from public.designations where id = p_designation_id and tenant_id = v_tenant_id) then
    raise exception 'designation_id does not belong to the current tenant';
  end if;
  if p_grade_id is not null and not exists (select 1 from public.grades where id = p_grade_id and tenant_id = v_tenant_id) then
    raise exception 'grade_id does not belong to the current tenant';
  end if;
  if p_manager_id is not null and not exists (select 1 from public.employees where id = p_manager_id and tenant_id = v_tenant_id) then
    raise exception 'manager_id does not belong to the current tenant';
  end if;

  insert into public.employees
    (tenant_id, legal_entity_id, employee_code, legal_name, date_of_birth, gender, pan_number, personal_email, personal_phone, status)
  values
    (v_tenant_id, p_legal_entity_id, 'EMP-' || floor(extract(epoch from clock_timestamp()) * 1000)::text, p_legal_name, p_date_of_birth, p_gender, p_pan_number, p_personal_email, p_personal_phone, 'active')
  returning * into v_employee;

  insert into public.employment_assignments
    (tenant_id, employee_id, department_id, designation_id, grade_id, manager_id, employment_type, effective_from, effective_to, reason_code)
  values
    (v_tenant_id, v_employee.id, p_department_id, p_designation_id, p_grade_id, p_manager_id, p_employment_type, p_joining_date, null, 'Hire');

  return v_employee;
end;
$$;
