-- Fixes a real cross-tenant data-integrity gap found during end-to-end verification against a
-- live project (not a hypothetical): calling transfer_employee() with another tenant's
-- employee_id did NOT fail. RLS correctly hid that employee's *current* assignment from the
-- caller (so v_current stayed null), but the function then happily inserted a new
-- employment_assignments row scoped to the CALLER's own tenant_id while still referencing the
-- foreign employee_id — a dangling cross-tenant reference. Postgres FK constraints don't catch
-- this: they only verify a referenced row exists *somewhere*, not that it belongs to the
-- caller's tenant. The same gap exists for every other FK-shaped parameter these two
-- SECURITY INVOKER functions accept (legal_entity_id, department_id, designation_id, grade_id,
-- location_id, manager_id) — none of them were previously checked against the caller's tenant
-- before use.
--
-- The fix: explicitly verify each caller-supplied id belongs to public.get_current_tenant_id()
-- before using it. Because these functions are SECURITY INVOKER, the verification SELECTs
-- below run under the caller's own RLS, so a foreign-tenant id simply won't be found — no new
-- privilege or bypass is introduced, this just makes the existing RLS boundary apply to FK
-- values the same way it already applies to direct reads.

create or replace function public.create_employee(
  p_legal_entity_id uuid,
  p_legal_name text,
  p_joining_date date,
  p_employment_type text,
  p_personal_email text default null,
  p_department_id uuid default null,
  p_designation_id uuid default null,
  p_grade_id uuid default null,
  p_manager_id uuid default null
)
returns public.employees
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant_id uuid := public.get_current_tenant_id();
  v_employee public.employees;
begin
  if v_tenant_id is null then
    raise exception 'No tenant context for the current user';
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

  insert into public.employees (tenant_id, legal_entity_id, employee_code, legal_name, personal_email, status)
  values (v_tenant_id, p_legal_entity_id, 'EMP-' || floor(extract(epoch from clock_timestamp()) * 1000)::text, p_legal_name, p_personal_email, 'draft')
  returning * into v_employee;

  insert into public.employment_assignments
    (tenant_id, employee_id, department_id, designation_id, grade_id, manager_id, employment_type, effective_from, effective_to, reason_code)
  values
    (v_tenant_id, v_employee.id, p_department_id, p_designation_id, p_grade_id, p_manager_id, p_employment_type, p_joining_date, null, 'Hire');

  return v_employee;
end;
$$;

create or replace function public.transfer_employee(
  p_employee_id uuid,
  p_effective_from date,
  p_reason_code text,
  p_department_id uuid default null,
  p_location_id uuid default null,
  p_designation_id uuid default null,
  p_grade_id uuid default null,
  p_manager_id uuid default null,
  p_employment_type text default null
)
returns public.employment_assignments
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant_id uuid := public.get_current_tenant_id();
  v_current public.employment_assignments;
  v_new public.employment_assignments;
begin
  if v_tenant_id is null then
    raise exception 'No tenant context for the current user';
  end if;

  if not exists (select 1 from public.employees where id = p_employee_id and tenant_id = v_tenant_id) then
    raise exception 'employee_id does not belong to the current tenant';
  end if;
  if p_department_id is not null and not exists (select 1 from public.departments where id = p_department_id and tenant_id = v_tenant_id) then
    raise exception 'department_id does not belong to the current tenant';
  end if;
  if p_location_id is not null and not exists (select 1 from public.locations where id = p_location_id and tenant_id = v_tenant_id) then
    raise exception 'location_id does not belong to the current tenant';
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

  select * into v_current from public.employment_assignments
    where tenant_id = v_tenant_id and employee_id = p_employee_id and effective_to is null
    limit 1;

  if v_current.id is not null and p_effective_from < v_current.effective_from then
    raise exception 'Effective date is before the current assignment started — use the retroactive-correction path, not this function (docs/hrms-prd/modules/01-core-hr-employee-information.md §7.3)';
  end if;

  if v_current.id is not null then
    update public.employment_assignments set effective_to = p_effective_from where id = v_current.id;
  end if;

  insert into public.employment_assignments
    (tenant_id, employee_id, department_id, location_id, designation_id, grade_id, manager_id, employment_type, effective_from, effective_to, reason_code)
  values (
    v_tenant_id, p_employee_id,
    coalesce(p_department_id, v_current.department_id),
    coalesce(p_location_id, v_current.location_id),
    coalesce(p_designation_id, v_current.designation_id),
    coalesce(p_grade_id, v_current.grade_id),
    coalesce(p_manager_id, v_current.manager_id),
    coalesce(p_employment_type, v_current.employment_type, 'Permanent'),
    p_effective_from, null, p_reason_code
  )
  returning * into v_new;

  return v_new;
end;
$$;
