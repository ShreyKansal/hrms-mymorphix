# Build Guide — Module 5: Leave Management

**Full spec:** [modules/05-leave-management.md](../../hrms-prd/modules/05-leave-management.md)
**Phase:** HR Operations, build alongside/right after Module 4 (they share the "team calendar" and "payroll handoff" concepts).

---

## What this module is, in one paragraph

Applying for time off, and — the genuinely fiddly part — keeping an accurate running balance per employee per leave type, with all the accrual/carry-forward/expiry math that implies. Get the balance arithmetic right; an employee who doesn't trust their leave balance stops trusting the whole system.

## The core idea: policy is configuration, not code

Every leave type (earned, casual, sick, maternity, etc.) has its own rules — how it accrues, whether unused days carry forward (and up to what cap), whether it can be cashed out, whether it expires. Build this as data the HR admin configures, not `if` statements in code for each leave type — this is the single biggest thing that separates "flexible, our customers can adapt this" from "rigid, they have to adapt to us" (a specific, named complaint we found researching competitors).

## Screens to build

1. **Apply for Leave** — pick leave type, date range (with half-day/hourly options), a reason. Shows current balance for that type right there, so the employee isn't guessing whether they have enough before they submit.
2. **My Leave** — balance by type, application history, status of pending requests.
3. **Team Leave Calendar** (manager view) — who's out, when — shown *inline* on the approval screen, not a separate page the manager has to remember to check before approving.
4. **Approval action** — reuses Module 17/Module 16's approval-inbox pattern, don't build a separate one here.
5. **Leave Policy configuration** (HR admin) — define a leave type's accrual rule, carry-forward cap, encashment rule, eligibility (which employees this applies to).
6. **Year-End Closure tool** (HR admin, run once a year) — a preview screen showing exactly what will happen to every employee's balance (carried forward / encashed / expired) before committing, since this is a once-a-year, hard-to-undo action.

## Key user flow: applying for leave

1. Employee picks a leave type and dates. System checks their current balance for that type.
2. If insufficient balance and the tenant doesn't allow negative balances, block with a clear message. If they do allow it, warn but let them proceed.
3. Check for overlap with an already-approved leave in the same date range (block duplicate applications).
4. Submit → routes through Module 17 to the manager (or a multi-level chain, if configured).
5. Manager sees the request with the team calendar inline, approves/rejects.
6. On approval, the balance is debited (exact timing — on submit vs. on approval — is a tenant setting, don't hard-code one).

## Key user flow: monthly accrual (a background job, not a screen)

1. A scheduled job runs (monthly, or per the policy's configured cadence) and adds the configured accrual amount to every eligible employee's balance for each leave type.
2. This has to correctly prorate for anyone who joined mid-month, and correctly skip anyone on a leave type that doesn't apply to them (per the eligibility rule in the policy config).

## Data model, simply

`leave_types` and `leave_policies` — the configuration (accrual rule, carry-forward cap, etc.). `leave_balances` — current balance per employee per leave type, plus a history of *why* it changed (accrual, application, manual adjustment, year-end closure) — don't just store one mutable number, keep the trail. `leave_requests` — the applications themselves, same approval-chain pattern as everything else routed through Module 17.

## States

**Leave request:** `Draft` → `Submitted` → `Approved`/`Rejected`/`Returned`/`Withdrawn` → (if Approved) `Cancelled` (if cancelled before/during the leave). Multi-level approval chains get an intermediate `Partially Approved` state.

## API endpoints

```
GET    /api/v1/leave/balance?employeeId=
POST   /api/v1/leave/requests
GET    /api/v1/leave/requests?employeeId=&status=
PATCH  /api/v1/leave/requests/:id/cancel
GET    /api/v1/leave/team-calendar?from=&to=
GET/POST/PATCH  /api/v1/leave-types, /leave-policies
POST   /api/v1/leave/year-end-closure/preview     — dry run, no data changed
POST   /api/v1/leave/year-end-closure/commit
```

## Components

`@atlaskit/form` for the application form (with `@atlaskit/datetime-picker` for date ranges), `@atlaskit/calendar` for the team calendar base, `@atlaskit/lozenge` for status badges, `@atlaskit/dynamic-table` for history/balance lists.

## What "done" looks like

- Apply for leave with insufficient balance and negative-balance disabled → blocked with a clear message, not a confusing partial submit.
- Approve a leave request, immediately check the employee's balance reflects it correctly.
- Run the monthly accrual job for a mixed batch of employees (some just joined, some on different policies) and confirm every one gets the mathematically correct amount.
- Run year-end closure preview, confirm the numbers shown exactly match what happens after you commit — no surprises between preview and reality.
