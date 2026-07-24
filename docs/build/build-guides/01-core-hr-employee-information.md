# Build Guide — Module 1: Core HR and Employee Information

**Read the full product spec first if you want the "why":** [modules/01-core-hr-employee-information.md](../../hrms-prd/modules/01-core-hr-employee-information.md). This guide is the "what's actually built / what's left to build" translation.
**Status:** Foundation phase, largely built. Stack: React 18 + Vite + Zustand + Supabase (Postgres/Auth/RLS), not the NestJS/REST stack this guide originally described — see [00-architecture-and-tech-stack.md](../00-architecture-and-tech-stack.md).
**You'll also need:** [05-organisation-data-model.md](../../hrms-prd/05-organisation-data-model.md) §7 — the "Employment Assignment" effective-dating pattern is the single most important idea in this module, and it's real, working code now, not just a design.

---

## What this module is, in one paragraph

Every employee in the system has one record here. Everything else in the product — attendance, leave, payroll, performance — points back to this employee record. The one tricky, important idea: when something about an employee changes (their department, their manager, their job title), **we don't overwrite the old value — we create a new dated record and keep the old one.** That's how the system can answer "who was Priya's manager last March" months or years later.

## The core data model, as actually built

Schema lives in [`supabase/migrations/20260724010000_foundation_schema.sql`](../../../supabase/migrations/20260724010000_foundation_schema.sql), plus [`20260724030000_education_previous_employment.sql`](../../../supabase/migrations/20260724030000_education_previous_employment.sql) for the two tables added below.

**`employees`** — one row per person, ever: legal name, date of birth, gender, PAN, personal email/phone, status. Emergency contacts/dependants/nominees are in the PRD's field list but have no backing table yet — not built.

**`employment_assignments`** — many rows per person, one per department/manager/designation/grade/employment-type change. Every row has `effective_from`, `effective_to` (null = current), `reason_code` (required — `'Hire' | 'Promotion' | 'Transfer' | 'ManagerChange' | 'Correction'`), `created_at`. Index: `(tenant_id, employee_id, effective_from)`. Writes never `UPDATE` a row's effective values — they close the old row out and `INSERT` a new one, done atomically inside a single Postgres function (`transfer_employee()`), not in application code.

**`employee_education`** and **`employee_previous_employment`** — one-to-many from an employee (multiple degrees, multiple past employers), simple insert-only tables (no effective-dating needed — a person's education history doesn't get "transferred").

**`departments` / `designations` / `grades`** — tenant-scoped reference data (Module 2 territory), referenced by `employment_assignments`. **Compensation** table exists in the schema but has no RPC function or UI yet — not built.

All tables have RLS enabled with a uniform `tenant_isolation` policy (`tenant_id = get_current_tenant_id()`) — see [`00-architecture-and-tech-stack.md`](../00-architecture-and-tech-stack.md) for why, and `supabase/migrations/20260724020000_rpc_tenant_ownership_checks.sql` for a real bug this caught (RPC functions weren't verifying caller-supplied ids like `employee_id`/`department_id` belonged to the caller's own tenant before use — fixed, re-verified against a live project).

## Screens — built vs. not

Source: [`apps/web/src/modules/core-hr/`](../../../apps/web/src/modules/core-hr/).

1. **Employee Directory** (`EmployeeDirectory.tsx`) — built. `@atlaskit/dynamic-table`, columns: name/code/designation/department/status, a Recharts headcount-by-status bar chart. Click a row → detail page. No search/filter yet (PRD calls for it; not built).

2. **Employee Detail** (`EmployeeDetail.tsx` + `ProfileTab.tsx` + `EmploymentTab.tsx`) — tabs, built vs. not:
   - **Profile** (`ProfileTab.tsx`) — built: personal info + contact (view/edit), Education (list + add), Previous Employment (list + add). **Not built:** emergency contacts, dependants, nominees, skills, certifications — no backing tables yet.
   - **Employment** (`EmploymentTab.tsx`) — built: current assignment card (department/designation/grade/reports-to/employment type/since), full history table, "Transfer" action.
   - **Compensation** — not built (no RPC, no UI; also depends on Module 21 permission-gating, which doesn't exist).
   - **Documents**, **Assets** — not built (Module 13/14 don't exist).
   - **Timeline** (unified audit feed) — not built (no audit-log table yet).

3. **Create Employee** (`CreateEmployeeModal.tsx`) — built. Modal, `@atlaskit/form`. Fields: legal name, personal email, joining date, department/designation/grade/manager (all optional pickers, sourced from `org-management`'s store and the employees list). Calls the `create_employee()` Postgres function.

4. **Transfer Employee** (`TransferEmployeeModal.tsx`) — built. Modal, defaults every field to the current assignment's value so a transfer is normally a one-field change. Fields: effective date, reason (dropdown), department/designation/grade/manager/employment type. Calls `transfer_employee()`. **Not built:** the payroll-lock check on backdated transfers (Module 6 doesn't exist yet).

5. **Org Chart** (`OrgChart.tsx`) — built, basic version. Manager → reports tree built client-side from the same employees list the Directory fetches (no separate query). Employees with no manager, or a manager outside the RLS-visible set, render as roots.

## Key user flow: transferring an employee (as actually built)

1. On the Employment tab, click "Transfer".
2. Modal opens, every field pre-filled with the current assignment's values (change only what's actually changing).
3. On submit, the client calls `supabase.rpc('transfer_employee', {...})`. Inside that single Postgres function: verify every supplied id (`employee_id`, `department_id`, etc.) belongs to the caller's tenant → close out the current assignment (`effective_to = new effective_from`) → insert the new row. Both writes happen in one transaction; there is no application-code coordination.
4. Employment tab refetches and shows the new assignment as current, old one in History with `effective_to` now set.
5. Backdated-transfer payroll-lock check: **not built** (Module 6 doesn't exist).

## States a record can be in

Schema supports `draft | active | on_leave | suspended | separation_initiated | separated` (`employees.status` check constraint). `create_employee()` always creates as `'draft'`; nothing in the UI transitions status yet — no "confirm employee" or separation flow exists.

## How writes actually work (no REST API)

There is no REST/HTTP API layer — the frontend talks to Postgres directly via `@supabase/supabase-js`, authenticated with the user's Supabase Auth JWT, authorized entirely by RLS. Two patterns, both used deliberately:

- **Multi-table atomic writes → Postgres RPC function.** `create_employee()` (employee + initial "Hire" assignment), `transfer_employee()` (close-out + new-row insert), `provision_tenant()` (tenant + org + legal entity + profile, at signup). All `SECURITY INVOKER` except `provision_tenant`/`get_current_tenant_id`, which need `SECURITY DEFINER` to bootstrap before any RLS context exists.
- **Single-table CRUD → direct client call.** Departments/designations/grades (`org-management` module), education/previous-employment rows, and the Profile tab's personal-info edit are plain `supabase.from(table).insert(...)` / `.update(...)` calls — RLS alone is sufficient, no atomicity concerns.

## Components to use (Atlaskit)

`@atlaskit/dynamic-table` (Directory), `@atlaskit/tabs` (Detail page — note: no `@atlaskit/page-header`, not a dependency), `@atlaskit/form` + `@atlaskit/textfield` for every form (no `@atlaskit/select` — plain native `<select>` wrapped by the shared [`src/lib/SelectField.tsx`](../../../apps/web/src/lib/SelectField.tsx) adapter instead, see that file's comment for why), `@atlaskit/modal-dialog` (Create/Transfer), `@atlaskit/lozenge` (status badges), `recharts` (Directory's headcount chart). No Timeline component exists since the Timeline tab isn't built.

## What "done" looks like today

- Create an employee → appears in the Directory immediately (Realtime subscription, not a manual refetch), correctly-generated Employee ID (`EMP-<timestamp>`, not a configurable numbering scheme — Module 22 doesn't exist).
- Transfer an employee → detail page shows the new assignment as current, old one stays visible in History. **Verified against a live Supabase project**, including a genuine cross-tenant attack attempt correctly rejected.
- Query "who was employee X's manager on [past date]" → answerable via the History table today; no dedicated "as of date" query UI yet, but the data/index support it.
- Compensation-view permission-gating → **not built**, no permission system exists (Module 21 not started). Everyone with tenant access sees everything that exists in the UI today.
