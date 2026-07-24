-- Adds the "education" and "previous employment" field groups Module 1's PRD lists for the
-- employee profile (docs/hrms-prd/modules/01-core-hr-employee-information.md §9) but that
-- weren't part of the Foundation-phase schema yet. Both are one-to-many from an employee (a
-- person can have multiple degrees, multiple past employers), so they're their own tables, not
-- flat columns on `employees` — a flat column could only ever hold one of each.
--
-- Same shape as every other tenant-scoped table in this schema: tenant_id + RLS's uniform
-- tenant_isolation policy, no special-cased insert path. Rows are created directly via
-- supabase-js .insert(), not an RPC — there's no multi-table atomicity need here the way
-- create_employee()/transfer_employee() have.

create table public.employee_education (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  employee_id uuid not null references public.employees(id),
  institution text not null,
  degree text not null,
  field_of_study text,
  start_year integer,
  end_year integer,
  created_at timestamptz not null default now()
);

create table public.employee_previous_employment (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  employee_id uuid not null references public.employees(id),
  company_name text not null,
  designation text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create index employee_education_employee_idx on public.employee_education (tenant_id, employee_id);
create index employee_previous_employment_employee_idx on public.employee_previous_employment (tenant_id, employee_id);

alter table public.employee_education enable row level security;
alter table public.employee_previous_employment enable row level security;

create policy "tenant_isolation" on public.employee_education
  using (tenant_id = public.get_current_tenant_id());
create policy "tenant_isolation" on public.employee_previous_employment
  using (tenant_id = public.get_current_tenant_id());
