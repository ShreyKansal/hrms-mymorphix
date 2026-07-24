-- HRMS — Foundation schema (Supabase/Postgres native)
--
-- Replaces the earlier NestJS+Prisma+custom-session-variable approach entirely. Multi-tenancy
-- here follows Supabase's own recommended pattern: a `profiles` table linking `auth.users` to
-- a tenant, a STABLE SECURITY DEFINER helper function to read the caller's tenant cheaply, and
-- RLS policies on every tenant-scoped table built on that helper. See
-- docs/hrms-prd/05-organisation-data-model.md for the underlying data-model reasoning (the
-- effective-dated Employment Assignment pattern in particular) — this migration is that
-- reasoning translated into Supabase-idiomatic SQL, not a new design.

-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ============================================================================
-- profiles — extends auth.users with app-specific data (tenant membership).
-- This is Supabase's own canonical pattern for attaching app data to an authenticated user.
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid, -- nullable: a user who has signed up but not yet completed tenant setup
  employee_id uuid, -- links this login to their own Employee record, once one exists (FK added below)
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_self_select" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid());
-- No insert/delete policy for normal users — profile rows are only ever created by the
-- provision_tenant() function below (SECURITY DEFINER, bypasses RLS deliberately and narrowly).

-- ============================================================================
-- Helper: the caller's current tenant, read once, reused by every RLS policy below.
-- STABLE (not VOLATILE) so Postgres can cache the result within one query/statement.
-- SECURITY DEFINER so it can read `profiles` regardless of the profiles table's own RLS
-- policies (which only allow a user to read their own row anyway, so this doesn't widen
-- access — it just avoids every single RLS policy needing its own subquery + join).
-- ============================================================================
create or replace function public.get_current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid();
$$;

-- ============================================================================
-- Core organisation structure — docs/hrms-prd/05-organisation-data-model.md §3
-- ============================================================================

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('provisioning', 'active', 'suspended', 'deprovisioned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.legal_entities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  organisation_id uuid not null references public.organisations(id),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  legal_entity_id uuid not null references public.legal_entities(id),
  name text not null,
  parent_id uuid references public.departments(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  legal_entity_id uuid not null references public.legal_entities(id),
  name text not null,
  state text,
  city text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.designations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  title text not null
);

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  code text not null,
  name text not null
);

-- ============================================================================
-- Employees + the effective-dated Employment Assignment pattern —
-- docs/hrms-prd/05-organisation-data-model.md §7. The one rule that matters most:
-- never edit an assignment's effective values in place — always insert a new row and
-- close out the old one's effective_to. Enforced by convention (the transfer_employee()
-- function below), not by a database constraint, mirroring how the PRD itself describes it.
-- ============================================================================

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  legal_entity_id uuid not null references public.legal_entities(id),
  employee_code text not null,
  legal_name text not null,
  date_of_birth date,
  gender text,
  pan_number text,
  aadhaar_hash text, -- store a hash, never the raw number — docs/hrms-prd/10-security-privacy-audit.md §2/§6
  personal_email text,
  personal_phone text,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'on_leave', 'suspended', 'separation_initiated', 'separated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, employee_code),
  unique (tenant_id, pan_number)
);

alter table public.profiles
  add constraint profiles_employee_id_fkey foreign key (employee_id) references public.employees(id);

create table public.employment_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  employee_id uuid not null references public.employees(id),
  department_id uuid references public.departments(id),
  location_id uuid references public.locations(id),
  designation_id uuid references public.designations(id),
  grade_id uuid references public.grades(id),
  manager_id uuid references public.employees(id),
  employment_type text not null,
  effective_from date not null,
  effective_to date, -- null = current
  reason_code text not null, -- 'Hire' | 'Promotion' | 'Transfer' | 'ManagerChange' | 'Correction' | ...
  approval_ref uuid, -- links to a Module 17 workflow instance, once that module exists
  created_at timestamptz not null default now()
);

-- The single most important index in this schema — every "what was true on date X" query
-- (docs/hrms-prd/modules/01-core-hr-employee-information.md §25) uses this.
create index employment_assignments_employee_effective_idx
  on public.employment_assignments (tenant_id, employee_id, effective_from);

create table public.compensations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  employee_id uuid not null references public.employees(id),
  ctc_annual numeric(14, 2) not null,
  currency text not null default 'INR',
  effective_from date not null,
  effective_to date,
  reason_code text not null,
  approval_ref uuid,
  created_at timestamptz not null default now()
);

create index compensations_employee_effective_idx
  on public.compensations (tenant_id, employee_id, effective_from);

-- ============================================================================
-- Row-Level Security — every tenant-scoped table, same uniform shape, no exceptions and
-- no special-cased "unconditional insert" policies (that was a real bug in the earlier
-- NestJS-era design — see the old docs/build/verification-evidence/README.md "Bug 3" for
-- why: INSERT ... RETURNING also needs to satisfy the SELECT policy, so a policy has to
-- be consistent for both, not just permissive on the way in).
-- ============================================================================

alter table public.tenants enable row level security;
alter table public.organisations enable row level security;
alter table public.legal_entities enable row level security;
alter table public.departments enable row level security;
alter table public.locations enable row level security;
alter table public.designations enable row level security;
alter table public.grades enable row level security;
alter table public.employees enable row level security;
alter table public.employment_assignments enable row level security;
alter table public.compensations enable row level security;

create policy "tenant_isolation" on public.tenants
  using (id = public.get_current_tenant_id());
create policy "tenant_isolation" on public.organisations
  using (tenant_id = public.get_current_tenant_id());
create policy "tenant_isolation" on public.legal_entities
  using (tenant_id = public.get_current_tenant_id());
create policy "tenant_isolation" on public.departments
  using (tenant_id = public.get_current_tenant_id());
create policy "tenant_isolation" on public.locations
  using (tenant_id = public.get_current_tenant_id());
create policy "tenant_isolation" on public.designations
  using (tenant_id = public.get_current_tenant_id());
create policy "tenant_isolation" on public.grades
  using (tenant_id = public.get_current_tenant_id());
create policy "tenant_isolation" on public.employees
  using (tenant_id = public.get_current_tenant_id());
create policy "tenant_isolation" on public.employment_assignments
  using (tenant_id = public.get_current_tenant_id());
create policy "tenant_isolation" on public.compensations
  using (tenant_id = public.get_current_tenant_id());

-- Every policy above uses USING only (no WITH CHECK) — Postgres defaults WITH CHECK to the
-- same expression as USING when omitted, which is exactly what we want (read and write both
-- scoped identically), and keeps the migration shorter without changing the actual behaviour.

-- ============================================================================
-- provision_tenant() — the bootstrapping operation. SECURITY DEFINER, deliberately: a user
-- who just signed up has no tenant_id yet, so normal RLS would block them from inserting
-- into tenants/organisations/legal_entities/profiles at all. This function is the one,
-- narrow, intentional exception — see docs/hrms-prd/modules/21-roles-permissions.md §24
-- ("nobody has a role to grant before the first tenant exists") and
-- docs/build/build-guides/22-system-administration.md's setup-wizard flow.
-- ============================================================================
create or replace function public.provision_tenant(company_name text, legal_entity_name text)
returns table (tenant_id uuid, organisation_id uuid, legal_entity_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_org_id uuid;
  v_legal_entity_id uuid;
begin
  if auth.uid() is null then
    raise exception 'provision_tenant requires an authenticated user';
  end if;

  if exists (select 1 from public.profiles where id = auth.uid() and profiles.tenant_id is not null) then
    raise exception 'This account is already part of a tenant';
  end if;

  insert into public.tenants (name, status) values (company_name, 'active') returning id into v_tenant_id;
  insert into public.organisations (tenant_id, name) values (v_tenant_id, company_name) returning id into v_org_id;
  insert into public.legal_entities (tenant_id, organisation_id, name)
    values (v_tenant_id, v_org_id, legal_entity_name) returning id into v_legal_entity_id;

  insert into public.profiles (id, tenant_id)
    values (auth.uid(), v_tenant_id)
    on conflict (id) do update set tenant_id = excluded.tenant_id;

  return query select v_tenant_id, v_org_id, v_legal_entity_id;
end;
$$;

-- ============================================================================
-- create_employee() — atomically creates the Employee row plus its initial ("Hire")
-- Employment Assignment. Both under normal RLS (SECURITY INVOKER, the default) since the
-- caller already has tenant context by this point — no elevated privilege needed here,
-- just atomicity across two related inserts.
-- ============================================================================
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

-- ============================================================================
-- transfer_employee() — the "never edit an assignment in place" pattern, atomically: close
-- out the current assignment's effective_to and insert the new one in one transaction.
-- docs/hrms-prd/modules/01-core-hr-employee-information.md §7.2.
-- ============================================================================
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
