# Build Guide — Module 27: Benefits Administration

**Full spec:** [modules/27-benefits-administration.md](../../hrms-prd/modules/27-benefits-administration.md)
**Phase:** Talent. Needs Module 6 (Payroll) for the deduction handoff, Module 1 (for reusing the Dependant entity).

---

## What this module is, in one paragraph

Health/life insurance plan enrollment — define plans, run an annual open-enrollment window, let employees pick coverage and add dependants, and hand the resulting payroll deduction to Module 6 cleanly. Don't confuse this with Module 6's "flexible benefit plans" (that's about structuring taxable salary components) — this is about actual insurance enrollment.

## Screens to build

1. **Plan Setup** (HR admin) — coverage tiers, cost-sharing (what the employer pays vs. the employee), eligibility rules. **Reuse the exact same eligibility-targeting logic already built for Module 20's policies** (grade/employment-type/location-based) — don't invent a second targeting system.
2. **Open Enrollment** (employee) — see what you're eligible for, what it costs per pay cycle, who you can cover (pulls from Module 1's existing Dependant records — don't duplicate that data here, just add a "covered: yes/no" flag on top of it).
3. **Enrollment Admin Dashboard** (HR admin) — completion tracking as the window closes, reminder-sending for stragglers.
4. **Life Event Change** — a mid-year change request (marriage, new child) outside the normal window, with a qualifying-window check and admin verification.

## Key user flow: open enrollment

1. Window opens. System finds everyone eligible for at least one plan, surfaces their options on their Employee Home.
2. Employee reviews cost/coverage/dependant options together on one screen (don't scatter this across multiple pages — the whole point is making an informed decision easy), submits.
3. Window closes → elections finalize → the resulting deduction amount gets queued as a `payroll_input` for Module 6's next cycle, the same handoff pattern already used for Leave/Attendance/Reimbursements.
4. Anyone who didn't act by the deadline follows whatever the tenant's configured default is (carry forward prior election, or no coverage) — this is a real policy choice with financial consequences for the employee, make it a config setting, not a hard-coded assumption.

## Data model

`benefits_plans`, `benefits_elections` (per employee, effective-dated, linking to Module 1's existing dependant records rather than duplicating them).

## API endpoints

```
GET/POST/PATCH  /api/v1/benefits-plans
GET             /api/v1/benefits/my-options          — eligible plans for the current user
POST            /api/v1/benefits/elections
POST            /api/v1/benefits/life-events           — off-cycle change request
GET             /api/v1/benefits/enrollment-status       — admin dashboard data
```

## What "done" looks like

- Define a plan with an eligibility rule referencing an existing Grade — confirm it correctly includes/excludes employees without any new targeting concept being built.
- Complete an open-enrollment election, confirm the resulting deduction shows up correctly in the next Module 6 payroll preview with zero manual reconciliation.
- Add a dependant during enrollment, confirm it's the same underlying record Module 1 already has for that person, not a duplicate.
