# Build Guide — Module 6: Payroll Management

**Full spec:** [modules/06-payroll-management.md](../../hrms-prd/modules/06-payroll-management.md)
**Phase:** Payroll. **This is the highest-risk module in the entire product.** Errors here cost real money and have legal consequences. Read this whole guide before writing code, and expect this module's review process to be slower and more careful than anything else you've built so far — that's intentional, not a process failure.
**Before you start:** the PM/legal team needs to have booked a qualified payroll professional to review the statutory calculations before this ships to real customers. If that hasn't happened, flag it — don't proceed to production data assuming someone else has it covered.

---

## What this module is, in one paragraph

Once a month (or whatever cycle the tenant uses), turn attendance data + leave data + one-time payments/deductions + salary structures into: correct statutory deductions (PF, ESI, Professional Tax, Labour Welfare Fund, TDS), a payslip per employee, a bank file to actually pay people, and a locked, permanent record of what happened. The hard part isn't the UI — it's making sure the numbers are right and that once real money has moved, we're honest about what can and can't be undone.

## The three ideas that matter more than any screen

**1. Preview before you commit, and make errors impossible to miss.** A payroll run isn't one button — it's: collect inputs → preview the calculation → review anything unusual → only then lock and pay. If any employee's number moved more than a configured threshold since last cycle, **force the Payroll Administrator to actively acknowledge that specific line** before they're allowed to lock the run. Don't let "approve the whole batch" silently wave through outliers — this is the single control most likely to catch a real error before it becomes a real payment.

**2. Once money has moved, "rollback" is a lie — don't build a button that pretends otherwise.** Before the bank file is actually sent, a "rollback" is a genuine, clean undo — revert the run to Pending, pull back the payslips. **After** the bank transfer has executed, there is no clean undo; it's a financial-recovery problem (asking someone to return money, adjusting the next cycle), not a system action. Build these as two visibly different flows in the UI, with different, honest language — never let "rollback" appear as an option once the system knows funds have moved.

**3. Statutory rates are data, not code.** PF percentage, ESI wage ceiling, Professional Tax slabs by state, TDS rules — these change over time, sometimes with little notice, and always independent of your deployment schedule. Store them in a versioned, effective-dated configuration table, exactly like Module 1's Employment Assignment pattern. A statutory-rate change should be something an admin (or you, quickly) can update in the database/admin screen, never something that requires a code change and a deploy.

## Screens to build

1. **Salary Structure Setup** (HR/Payroll admin) — define pay components (Basic, HRA, other allowances, deductions) per employee or per a template applied to a group. Each component needs its tax/statutory treatment defined explicitly — no component should be usable in a real structure until someone has said whether it's taxable, PF-eligible, etc.
2. **Payroll Run — Input Collection** — a dashboard showing, for the current cycle: attendance data pulled in (from Module 4, already locked), leave/LOP data (from Module 5), pending reimbursements (Module 7), and a place to add one-time payments/deductions (bonuses, corrections). Anything missing (e.g., a new hire without bank details) blocks that specific employee, clearly, not the whole run.
3. **Payroll Run — Preview** — runs the actual calculation without committing anything. Shows a **variance report**: this cycle vs. last cycle, per employee, sorted so outliers are impossible to miss. Anyone can re-run preview as many times as needed after fixing an input — it has zero side effects.
4. **Payroll Run — Lock** — the point of no return for this cycle. Requires stepping through any flagged variances (per idea #1 above) before the "Lock" button is even enabled. Consider a re-authentication step here (re-enter password) given how consequential this action is.
5. **Payslip view** (employee-facing, read-only) — full breakdown, with the attendance/leave data that produced any LOP figure visible right there, so an employee can see *why* a number is what it is without filing a helpdesk ticket.
6. **Statutory Reports** — PF/ESI/PT/TDS summaries in the format needed for filing, plus a compliance-deadline tracker.
7. **Tax Declaration** (employee-facing) — submit investment declarations, see a real-time estimate of how it changes their monthly TDS.
8. **Full & Final Settlement** — triggered from Module 15 (Separation): pro-rated final pay, leave encashment, gratuity if eligible, loan recovery, less any recoverable dues.

## Key user flow: a standard monthly run

1. Cycle date arrives. Payroll Executive opens the run — inputs auto-populate from Attendance/Leave/Reimbursements.
2. They review the exception list (anyone with missing mandatory data), resolve what they can.
3. Hit "Preview" — full calculation runs, nothing is saved to a "final" state yet. Variance report shows.
4. Anything flagged gets individually acknowledged or sent back for correction (loop back to step 1).
5. Payroll Administrator reviews, hits "Lock." System generates payslips, the bank transfer file, and marks the underlying Attendance/Leave/Reimbursement data for that period as consumed (still there, just no longer editable through the normal screens).
6. Bank file goes out (via Module 23's banking integration, built separately). Payslips become visible to employees.

## Key idea: retroactive changes never touch the past directly

If someone's salary changes with an effective date that's already been paid, **do not go back and edit the old, locked payroll run.** Instead: calculate the difference (arrears) and add it as a one-time payment to the *next* (or an off-cycle) run. This is the same "never edit history, only add a new dated record" pattern you've now seen in Module 1, Module 4, and Module 20 — it's the same idea every time, applied here to money specifically.

## Data model, simply

`payroll_groups`, `pay_components`, `salary_structures` — the configuration. `payroll_runs` (one per cycle, with a status: Draft → Input Collection → Preview Ready → Pending Approval → Locked → Disbursed, and separately, Rolled Back only reachable pre-disbursal). `payroll_inputs` (per employee, per run — attendance-derived LOP, leave encashment, one-time items, all pulled in and then frozen once the run locks). `payslips` (the final, immutable output). `statutory_rates` (versioned/effective-dated, per idea #3 above).

## API endpoints

```
GET/POST/PATCH  /api/v1/salary-structures, /pay-components
POST            /api/v1/payroll-runs                     — create a new cycle
GET             /api/v1/payroll-runs/:id/inputs           — collected inputs + exceptions
POST            /api/v1/payroll-runs/:id/preview          — calculate, no side effects
GET             /api/v1/payroll-runs/:id/variance          — the variance report
POST            /api/v1/payroll-runs/:id/lock               — the point-of-no-return action
POST            /api/v1/payroll-runs/:id/rollback            — only valid pre-disbursal, checks disbursal status first
GET             /api/v1/employees/:id/payslips
POST            /api/v1/tax-declarations
GET             /api/v1/tax-declarations/:id/tds-preview     — real-time impact calc
POST            /api/v1/separations/:id/settlement            — full & final, called from Module 15
GET/PATCH       /api/v1/statutory-rates                        — versioned config, not code
```

## What "done" looks like

- Run a full preview, deliberately introduce a large salary change for one test employee, confirm the variance report flags it and blocks locking until acknowledged.
- Lock a run, then try to directly edit any of the underlying attendance/leave/payroll data for that period through the normal screens — confirm it's genuinely blocked, with the only path being the arrears mechanism on a *future* run.
- Attempt a rollback both before and after simulating a completed bank disbursal — confirm the UI and the backend behave completely differently in each case, and that the post-disbursal case never claims to be a clean undo.
- Change a statutory rate (e.g., a test PT slab) via configuration, confirm the next preview run picks it up without a code deploy.
- Get a qualified payroll professional to actually check a full run's numbers against a manual calculation before this touches real employee data.
