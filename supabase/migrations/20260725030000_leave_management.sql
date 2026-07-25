-- Module 5 — Leave Management (docs/hrms-prd/modules/05-leave-management.md)
--
-- Scope of THIS slice: the high-frequency core the PRD calls out as its whole reason to exist —
-- a configurable (not hard-coded) leave-type/policy engine, per-employee balances, and the
-- apply → approve/reject → cancel workflow with an always-accurate balance behind it. The PRD's
-- own §27 risk note is that the *arithmetic* is what erodes trust, so the balance model here is
-- deliberately explicit and auditable rather than a single opaque counter:
--
--   available = entitled + adjustment - taken - pending
--
-- and every state transition moves days between exactly two of those buckets, never mutating a
-- balance ambiguously (§14's "every transition has a balance impact" requirement).
--
-- Deliberately NOT in this slice (called out so the omission is honest, not silent):
--   * Year-end closure / carry-forward / encashment (§7.3) — a once-a-year, high-blast-radius
--     batch with a preview-before-commit requirement; the columns it needs (carry_forward_cap)
--     exist here, but the batch job itself is a separate build, not half-implemented now.
--   * Multi-level / delegated approval routing — that's Module 17's engine; this module only
--     defines the trigger and the approver's context (the team calendar), per §13's framing.
--   * Proration for mid-year joiners, sandwich-rule, blackout periods, holiday-calendar-aware
--     day counting — the last needs Module 4 (Attendance) which isn't built; until then days are
--     counted as working days (Mon–Fri), documented on leave_working_days() below.
--
-- Conventions follow the rest of this schema exactly: tenant_isolation RLS on every table,
-- SECURITY INVOKER RPCs that re-check the caller's role for admin-gated writes (create_employee()
-- established this pattern in 20260724070000_admin_only_write_checks.sql), and tenant-ownership
-- checks on every foreign key passed in from the client.

-- ============================================================================
-- leave_types — the configurable policy engine (US-3: "configure a new leave type ... without
-- engineering involvement"). One row per leave category per tenant.
-- ============================================================================
create table public.leave_types (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  name text not null,                     -- e.g. 'Earned Leave'
  code text not null,                     -- short label, e.g. 'EL'
  color text not null default 'slate',    -- UI accent (avatar-style tint keys)
  is_paid boolean not null default true,  -- unpaid leave feeds Module 6 as LOP
  accrual_method text not null default 'annual' check (accrual_method in ('none', 'monthly', 'annual')),
  annual_quota numeric(6, 2) not null default 0,  -- days granted per leave-year
  allow_half_day boolean not null default true,
  allow_negative boolean not null default false,  -- §10: off by default, tenant-configurable
  negative_cap numeric(6, 2) not null default 0,  -- max days a balance may go below zero
  carry_forward_cap numeric(6, 2),                -- null = no carry-forward (year-end closure, later)
  requires_reason boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, code)
);

-- ============================================================================
-- leave_balances — one row per employee per leave type per leave-year. The four buckets are the
-- whole trust story: never derive "available" from request history at read time (slow and
-- error-prone), always keep these summed columns authoritative and move days between them
-- transactionally in the RPCs below.
-- ============================================================================
create table public.leave_balances (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  employee_id uuid not null references public.employees(id),
  leave_type_id uuid not null references public.leave_types(id),
  year int not null,
  entitled numeric(7, 2) not null default 0,   -- granted for the year (from annual_quota, or accrued)
  adjustment numeric(7, 2) not null default 0, -- manual +/- corrections (§17 bulk adjust, §7.3 exceptions)
  taken numeric(7, 2) not null default 0,      -- approved & consumed
  pending numeric(7, 2) not null default 0,    -- held by not-yet-decided requests
  adjustment_reason text,                      -- §7.1 mandatory-reason rule for the last adjustment
  adjusted_by uuid references auth.users(id),
  adjusted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, employee_id, leave_type_id, year)
);

create index leave_balances_employee_idx on public.leave_balances (tenant_id, employee_id, year);

-- ============================================================================
-- leave_requests — the application record and its state machine (§14).
-- ============================================================================
create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  employee_id uuid not null references public.employees(id),
  leave_type_id uuid not null references public.leave_types(id),
  start_date date not null,
  end_date date not null,
  day_part text not null default 'full' check (day_part in ('full', 'first_half', 'second_half')),
  days numeric(6, 2) not null,             -- computed server-side, never trusted from the client
  reason text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled', 'withdrawn')),
  applied_by uuid references auth.users(id),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index leave_requests_employee_idx on public.leave_requests (tenant_id, employee_id, start_date);
create index leave_requests_status_idx on public.leave_requests (tenant_id, status);

-- ============================================================================
-- RLS. The write path matters here more than for reference data, so it's tighter than a single
-- permissive tenant_isolation policy would be:
--
--   * leave_types  — any tenant member reads; only admins write directly. Same split-policy
--     shape as departments/designations/grades (20260724080000). upsert_leave_type() also
--     re-checks admin in code, so this is belt-and-suspenders, not the only gate.
--
--   * leave_balances / leave_requests — any tenant member reads, but there is NO direct-write
--     policy at all. Every mutation goes through the SECURITY DEFINER RPCs below, which is the
--     whole point: the balance arithmetic and the approval gate must not be bypassable by a
--     client issuing a raw INSERT/UPDATE (e.g. inserting a request already marked 'approved',
--     or updating `entitled` upward). With RLS enabled and no write policy, such direct writes
--     are denied; the RPCs run as definer and enforce the rules explicitly. This is the same
--     controlled-privilege pattern provision_tenant()/accept_pending_invitation() use.
-- ============================================================================
alter table public.leave_types enable row level security;
alter table public.leave_balances enable row level security;
alter table public.leave_requests enable row level security;

create policy "tenant_isolation_select" on public.leave_types
  for select using (tenant_id = public.get_current_tenant_id());
create policy "tenant_isolation_write" on public.leave_types
  for all using (
    tenant_id = public.get_current_tenant_id()
    and (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Read-only to the client; all writes are through the RPCs (SECURITY DEFINER) below.
create policy "tenant_isolation_select" on public.leave_balances
  for select using (tenant_id = public.get_current_tenant_id());
create policy "tenant_isolation_select" on public.leave_requests
  for select using (tenant_id = public.get_current_tenant_id());

-- ============================================================================
-- leave_working_days() — inclusive working-day count between two dates, excluding Sat/Sun.
-- Public holidays and configurable week-offs come with Module 4 (Attendance); until that exists
-- a Mon–Fri count is the honest, deterministic default (documented here rather than silently
-- counting weekends as leave). extract(dow) is 0=Sun .. 6=Sat.
-- ============================================================================
create or replace function public.leave_working_days(p_start date, p_end date)
returns numeric
language sql
immutable
as $$
  select count(*)::numeric
  from generate_series(p_start, p_end, interval '1 day') d
  where extract(dow from d) not in (0, 6);
$$;

-- ============================================================================
-- upsert_leave_type() — admin-only create/update of a leave type. Pass p_id null to create.
-- ============================================================================
create or replace function public.upsert_leave_type(
  p_name text,
  p_code text,
  p_annual_quota numeric,
  p_id uuid default null,
  p_color text default 'slate',
  p_is_paid boolean default true,
  p_accrual_method text default 'annual',
  p_allow_half_day boolean default true,
  p_allow_negative boolean default false,
  p_negative_cap numeric default 0,
  p_carry_forward_cap numeric default null,
  p_requires_reason boolean default false,
  p_is_active boolean default true
)
returns public.leave_types
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant_id uuid := public.get_current_tenant_id();
  v_caller_role text;
  v_row public.leave_types;
begin
  if v_tenant_id is null then
    raise exception 'No tenant context for the current user';
  end if;

  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role is distinct from 'admin' then
    raise exception 'Only admins can configure leave types';
  end if;

  if p_accrual_method not in ('none', 'monthly', 'annual') then
    raise exception 'Invalid accrual_method: %', p_accrual_method;
  end if;

  if p_id is null then
    insert into public.leave_types (
      tenant_id, name, code, color, is_paid, accrual_method, annual_quota,
      allow_half_day, allow_negative, negative_cap, carry_forward_cap, requires_reason, is_active)
    values (
      v_tenant_id, p_name, upper(p_code), p_color, p_is_paid, p_accrual_method, p_annual_quota,
      p_allow_half_day, p_allow_negative, p_negative_cap, p_carry_forward_cap, p_requires_reason, p_is_active)
    returning * into v_row;
  else
    update public.leave_types set
      name = p_name, code = upper(p_code), color = p_color, is_paid = p_is_paid,
      accrual_method = p_accrual_method, annual_quota = p_annual_quota,
      allow_half_day = p_allow_half_day, allow_negative = p_allow_negative,
      negative_cap = p_negative_cap, carry_forward_cap = p_carry_forward_cap,
      requires_reason = p_requires_reason, is_active = p_is_active
    where id = p_id and tenant_id = v_tenant_id
    returning * into v_row;

    if v_row.id is null then
      raise exception 'leave_type_id does not belong to the current tenant';
    end if;
  end if;

  return v_row;
end;
$$;

-- ============================================================================
-- ensure_leave_balance() — internal helper: returns the balance row for (employee, type, year),
-- creating it from the type's annual_quota on first touch. SECURITY DEFINER because leave_balances
-- has no client write policy — writes only happen inside these RPCs. Still tenant-scoped: every
-- read/write is filtered by get_current_tenant_id() (which resolves the *caller's* tenant even
-- under definer, since auth.uid() reflects the request, not the function owner).
-- ============================================================================
create or replace function public.ensure_leave_balance(
  p_employee_id uuid,
  p_leave_type_id uuid,
  p_year int
)
returns public.leave_balances
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid := public.get_current_tenant_id();
  v_quota numeric;
  v_row public.leave_balances;
begin
  select * into v_row from public.leave_balances
    where tenant_id = v_tenant_id and employee_id = p_employee_id
      and leave_type_id = p_leave_type_id and year = p_year;
  if found then
    return v_row;
  end if;

  select annual_quota into v_quota from public.leave_types
    where id = p_leave_type_id and tenant_id = v_tenant_id;
  if v_quota is null then
    raise exception 'leave_type_id does not belong to the current tenant';
  end if;

  insert into public.leave_balances (tenant_id, employee_id, leave_type_id, year, entitled)
  values (v_tenant_id, p_employee_id, p_leave_type_id, p_year, v_quota)
  returning * into v_row;

  return v_row;
end;
$$;

-- ============================================================================
-- apply_leave() — the application trigger (§7.1). Computes days server-side, checks balance
-- (unless negative leave is policy-permitted within the cap — §10), creates the request as
-- 'pending' and places a hold on the balance's `pending` bucket, all in one transaction.
-- ============================================================================
create or replace function public.apply_leave(
  p_employee_id uuid,
  p_leave_type_id uuid,
  p_start_date date,
  p_end_date date,
  p_day_part text default 'full',
  p_reason text default null
)
returns public.leave_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid := public.get_current_tenant_id();
  v_type public.leave_types;
  v_balance public.leave_balances;
  v_days numeric;
  v_available numeric;
  v_year int := extract(year from p_start_date);
  v_request public.leave_requests;
begin
  if v_tenant_id is null then
    raise exception 'No tenant context for the current user';
  end if;

  if not exists (select 1 from public.employees where id = p_employee_id and tenant_id = v_tenant_id) then
    raise exception 'employee_id does not belong to the current tenant';
  end if;

  select * into v_type from public.leave_types where id = p_leave_type_id and tenant_id = v_tenant_id;
  if v_type.id is null then
    raise exception 'leave_type_id does not belong to the current tenant';
  end if;
  if not v_type.is_active then
    raise exception 'This leave type is no longer active';
  end if;

  if p_end_date < p_start_date then
    raise exception 'End date must be on or after the start date';
  end if;
  if extract(year from p_end_date) <> v_year then
    -- A request spanning a leave-year boundary needs the closure/proration logic that isn't in
    -- this slice (§24 edge case) — block clearly rather than mis-count it.
    raise exception 'A single request cannot span two leave years yet — split it at the year boundary';
  end if;

  -- Half-day is only meaningful for a single calendar day.
  if p_day_part <> 'full' then
    if not v_type.allow_half_day then
      raise exception 'This leave type does not allow half-day leave';
    end if;
    if p_start_date <> p_end_date then
      raise exception 'Half-day leave must be a single day';
    end if;
    v_days := 0.5;
  else
    v_days := public.leave_working_days(p_start_date, p_end_date);
  end if;

  if v_days <= 0 then
    raise exception 'The selected dates contain no working days';
  end if;

  if v_type.requires_reason and (p_reason is null or btrim(p_reason) = '') then
    raise exception 'A reason is required for this leave type';
  end if;

  v_balance := public.ensure_leave_balance(p_employee_id, p_leave_type_id, v_year);
  v_available := v_balance.entitled + v_balance.adjustment - v_balance.taken - v_balance.pending;

  if v_days > v_available then
    if not v_type.allow_negative then
      raise exception 'Insufficient balance: % day(s) available, % requested', v_available, v_days;
    elsif (v_available - v_days) < (-1 * v_type.negative_cap) then
      raise exception 'Request exceeds the permitted negative balance limit of % day(s)', v_type.negative_cap;
    end if;
  end if;

  insert into public.leave_requests
    (tenant_id, employee_id, leave_type_id, start_date, end_date, day_part, days, reason, status, applied_by)
  values
    (v_tenant_id, p_employee_id, p_leave_type_id, p_start_date, p_end_date, p_day_part, v_days, p_reason, 'pending', auth.uid())
  returning * into v_request;

  update public.leave_balances set pending = pending + v_days where id = v_balance.id;

  return v_request;
end;
$$;

-- ============================================================================
-- decide_leave() — admin/approver decision (§7.1). Approve moves the held days from `pending`
-- to `taken`; reject/return releases the hold. Idempotency is guaranteed by only acting on a
-- still-'pending' request (a second call finds nothing to move).
-- ============================================================================
create or replace function public.decide_leave(
  p_request_id uuid,
  p_approve boolean,
  p_note text default null
)
returns public.leave_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid := public.get_current_tenant_id();
  v_caller_role text;
  v_req public.leave_requests;
  v_year int;
begin
  if v_tenant_id is null then
    raise exception 'No tenant context for the current user';
  end if;

  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role is distinct from 'admin' then
    raise exception 'Only admins can approve or reject leave';
  end if;

  select * into v_req from public.leave_requests
    where id = p_request_id and tenant_id = v_tenant_id for update;
  if v_req.id is null then
    raise exception 'leave request not found in the current tenant';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'Only a pending request can be decided (current status: %)', v_req.status;
  end if;

  v_year := extract(year from v_req.start_date);

  if p_approve then
    update public.leave_balances
      set pending = pending - v_req.days, taken = taken + v_req.days
      where tenant_id = v_tenant_id and employee_id = v_req.employee_id
        and leave_type_id = v_req.leave_type_id and year = v_year;
    update public.leave_requests
      set status = 'approved', decided_by = auth.uid(), decided_at = now(), decision_note = p_note
      where id = v_req.id returning * into v_req;
  else
    update public.leave_balances
      set pending = pending - v_req.days
      where tenant_id = v_tenant_id and employee_id = v_req.employee_id
        and leave_type_id = v_req.leave_type_id and year = v_year;
    update public.leave_requests
      set status = 'rejected', decided_by = auth.uid(), decided_at = now(), decision_note = p_note
      where id = v_req.id returning * into v_req;
  end if;

  return v_req;
end;
$$;

-- ============================================================================
-- cancel_leave() — withdraw a pending request or cancel an approved one (§7.2). Releases the
-- `pending` hold (for pending requests) or credits `taken` back (for approved ones). Anyone in
-- the tenant may cancel in this slice (self-service withdrawal); the manager-re-approval-for-
-- in-progress-leave nuance is deferred with Module 17's routing.
-- ============================================================================
create or replace function public.cancel_leave(p_request_id uuid)
returns public.leave_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid := public.get_current_tenant_id();
  v_req public.leave_requests;
  v_year int;
  v_new_status text;
begin
  if v_tenant_id is null then
    raise exception 'No tenant context for the current user';
  end if;

  select * into v_req from public.leave_requests
    where id = p_request_id and tenant_id = v_tenant_id for update;
  if v_req.id is null then
    raise exception 'leave request not found in the current tenant';
  end if;
  if v_req.status not in ('pending', 'approved') then
    raise exception 'Only a pending or approved request can be cancelled (current status: %)', v_req.status;
  end if;

  v_year := extract(year from v_req.start_date);

  if v_req.status = 'pending' then
    update public.leave_balances set pending = pending - v_req.days
      where tenant_id = v_tenant_id and employee_id = v_req.employee_id
        and leave_type_id = v_req.leave_type_id and year = v_year;
    v_new_status := 'withdrawn';
  else
    update public.leave_balances set taken = taken - v_req.days
      where tenant_id = v_tenant_id and employee_id = v_req.employee_id
        and leave_type_id = v_req.leave_type_id and year = v_year;
    v_new_status := 'cancelled';
  end if;

  update public.leave_requests set status = v_new_status where id = v_req.id returning * into v_req;
  return v_req;
end;
$$;

-- ============================================================================
-- adjust_leave_balance() — admin-only manual correction with a mandatory reason (§7.1 business
-- rule, §17 bulk-adjust building block). Applies a signed delta to the `adjustment` bucket and
-- records who/why/when on the row for transparency (a full audit-log table lands with Phase 11).
-- ============================================================================
create or replace function public.adjust_leave_balance(
  p_employee_id uuid,
  p_leave_type_id uuid,
  p_year int,
  p_delta numeric,
  p_reason text
)
returns public.leave_balances
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid := public.get_current_tenant_id();
  v_caller_role text;
  v_balance public.leave_balances;
begin
  if v_tenant_id is null then
    raise exception 'No tenant context for the current user';
  end if;

  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role is distinct from 'admin' then
    raise exception 'Only admins can adjust leave balances';
  end if;

  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'A reason is required for a balance adjustment';
  end if;

  v_balance := public.ensure_leave_balance(p_employee_id, p_leave_type_id, p_year);

  update public.leave_balances
    set adjustment = adjustment + p_delta,
        adjustment_reason = p_reason,
        adjusted_by = auth.uid(),
        adjusted_at = now()
    where id = v_balance.id
    returning * into v_balance;

  return v_balance;
end;
$$;
