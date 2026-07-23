# Module 5 — Leave Management

**Status:** Draft v1 (pending stakeholder review) · **Release:** HR Operations
**Depends on:** Module 1 (Core HR — Leave Policy Group assignment), Module 4 (Attendance, weekly-off/holiday coordination), Module 17 (Workflow Engine)

---

## 1. Module overview

Leave types, policies, accrual, balances, application/approval, and every statutory and company-specific leave category (maternity, paternity, adoption, bereavement, compensatory, unpaid, restricted holidays) — plus the mechanics that make leave *policy* into leave *balance* (proration, carry-forward, encashment, expiry, negative leave) accurately over time.

## 2. Problem statement

Leave accrual/carry-forward/encashment rules are numerically intricate and vary by leave type, employment type, tenure, and sometimes location/state — getting the arithmetic wrong erodes trust immediately (an incorrect balance is one of the fastest ways an employee loses confidence in an HR system) and has direct payroll and statutory implications (leave encashment, LOP).

## 3. Business objective

Give employees an always-accurate, always-current leave balance and a fast application/approval path; give HR a configurable-not-hard-coded policy engine that doesn't require vendor support tickets for routine policy changes (a named competitor weakness — Keka/RazorpayX's "rigid, hard-wired" complaints); give Payroll unambiguous leave data for LOP/encashment calculation.

## 4. User personas

Primary: **Employee** (apply, view balance — high-frequency), **People Manager** (approve — high-frequency, mobile-priority). Secondary: **HR Administrator** (policy configuration), **Payroll Executive** (LOP/encashment consumption), **HR Executive** (balance adjustments, exception handling).

## 5. User needs

Employee needs to know their real, current balance before applying (not discover a shortfall after submission) and see the status of a pending request without asking HR. Manager needs team-calendar context (who else is out) before approving, in one view, not a separate lookup. HR needs to configure leave policy per employee segment without needing engineering/vendor help for routine changes — directly addressing the Keka/RazorpayX "rigid" complaint pattern found in Phase 2 research.

## 6. Primary use cases

Apply for leave (full-day/half-day/hourly); view leave balance and history; cancel/withdraw/extend a leave request; manager approves/rejects with team-calendar context; HR configures leave types/policies/accrual rules; year-end leave closure (carry-forward/encashment/expiry processing); leave-balance manual adjustment (with mandatory reason).

## 7. Detailed workflows

### 7.1 Leave application and approval

- **Trigger:** Employee applies for leave.
- **Preconditions:** Employee is Active; sufficient balance for the leave type (unless negative leave is policy-permitted, see §10).
- **Actor:** Employee (applies), Manager or configured approver chain (approves).
- **Steps:** 1) Employee selects leave type, date range (or half-day/hourly per §9), enters reason (mandatory for some types per policy) 2) System checks balance, blackout-period conflicts (§10), and overlapping-approved-leave conflicts within the team (surfaced as a warning, not necessarily a hard block, per §10) 3) Routed to approver per Module 17 configuration (can be multi-level, e.g., manager then HRBP for extended leave) 4) Approver reviews against team leave calendar (shown inline) 5) On approval, balance is provisionally debited; on final payroll processing, this feeds Module 6 if the leave type is unpaid/LOP-relevant.
- **Decision points:** Overlapping leave within the team beyond a configured threshold (e.g., "no more than 30% of the team out simultaneously") — configurable warning or hard block per tenant policy, not assumed.
- **Approval logic:** Multi-level, delegated, or auto-approval-below-threshold — all configurable per Module 17, this module only defines the trigger and the data it needs from the approver's context (team calendar).
- **Notifications:** Manager (new request), employee (approved/rejected), team (optional, configurable "X is out on Y date" visibility).
- **Failure handling:** Rejected request returns to Draft with the manager's reason; employee may revise and resubmit.
- **Audit events:** `LeaveApplied`, `LeaveApproved`/`LeaveRejected`, each with balance-impact snapshot.

### 7.2 Leave cancellation, withdrawal, and extension

- **Trigger:** Employee needs to cancel an already-approved leave, withdraw a pending request, or extend an ongoing leave.
- **Steps (cancellation of approved future leave):** 1) Employee requests cancellation 2) If leave hasn't started yet, straightforward — balance is credited back, no approval needed by default (configurable to require manager re-approval) 3) If leave has already partially elapsed, cancellation of the remaining portion requires manager approval (return-to-work coordination). **Steps (extension):** 1) Employee requests additional days appended to an ongoing/recently-ended leave 2) Treated as a new linked leave application (not a silent balance mutation of the original), routed through the same approval flow, but flagged as an extension for reporting/context purposes.
- **Audit events:** `LeaveCancelled`/`LeaveWithdrawn`/`LeaveExtended`, each linked to the original request.

### 7.3 Year-end leave closure

- **Trigger:** Configured leave-year-end date (tenant-configurable, may differ from fiscal year — see [05-organisation-data-model.md](../05-organisation-data-model.md) for the broader "leave year" concept referenced under Module 22).
- **Steps:** 1) System computes each employee's year-end balance per leave type 2) Applies configured carry-forward rules (capped or uncapped, per leave type) 3) Applies configured encashment rules (eligible leave types, max encashable days, requires employee election in some policy designs vs. automatic) 4) Applies expiry to any balance not carried forward or encashed 5) Generates a payroll input for any encashment amount (Module 6) 6) Produces a year-end leave-balance report for HR review before finalising (preview-before-commit, given the irreversibility of expiry).
- **Failure handling:** HR can adjust individual balances with a mandatory reason before final commit if the automated calculation needs a manual exception (e.g., a maternity-leave-affected accrual pause).
- **Audit events:** `LeaveYearClosed`, with full before/after balance snapshot per employee — this is a high-blast-radius, once-a-year event that needs strong auditability.

## 8. User stories

**US-1**
As an **Employee**, I want to see my current leave balance by type before I apply, so that I don't submit a request I can't actually take.
**Acceptance criteria:** Given an employee has 2 days of Earned Leave remaining, when they attempt to apply for 3 days, then the system either blocks submission (if negative leave isn't policy-permitted) or clearly warns that the request will result in a negative balance (if it is) — never silently allows an ambiguous submission.

**US-2**
As a **People Manager**, I want to see my team's leave calendar when reviewing a pending request, so that I can make an informed coverage decision without a separate lookup.
**Acceptance criteria:** Given a manager opens a pending leave-approval notification, when the approval screen loads, then the team's approved-leave calendar for the overlapping period is shown inline, not requiring separate navigation.

**US-3**
As an **HR Administrator**, I want to configure a new leave type with its own accrual/carry-forward/encashment rules without engineering involvement, so that policy changes don't require a support ticket — directly addressing the "rigid, hard-wired" complaint pattern found against Keka and RazorpayX in competitor research.
**Acceptance criteria:** Given a new leave type is configured with a monthly-accrual rule and a carry-forward cap, when an employee's monthly accrual runs, then their balance reflects the new rule from its effective date forward without requiring a system deployment.

## 9. Functional requirements

Leave types (statutory: maternity, paternity, adoption, bereavement per applicable Indian law; company-specific: earned/casual/sick/restricted-holiday/compensatory/unpaid); leave policy groups (per [05](../05-organisation-data-model.md) §3) with configurable eligibility, accrual (monthly/annual), proration (for mid-year joiners/leavers), carry-forward, encashment, expiry, negative-leave permission; half-day and hourly leave; sandwich-leave rule (weekend/holiday between two leave days counted as leave, per configurable policy — a common Indian-company policy pattern); restricted holidays (employee selects from a list, per-employee/per-location); multi-level and delegated approval; team leave calendar; overlapping-leave and blackout-period handling; leave-balance manual adjustment with mandatory reason; year-end closure (§7.3); payroll integration for LOP and encashment.

## 10. Business rules

Negative leave (applying beyond available balance) is off by default, tenant-configurable to allow up to a capped negative balance (recovered via future accrual or payroll deduction — the latter requiring explicit Module 6 coordination). Sandwich-rule application is leave-type-and-tenant-configurable, not hard-coded, given how much this varies by company policy. Blackout periods (e.g., no leave during a defined critical business period) block or warn per tenant configuration, with an HR-override path for genuine exceptions.

## 11. Validation rules

Date-range validation (end date after start date, no past-dated applications beyond a configurable grace window without HR involvement); half-day requires a valid half-day-eligible leave type; maternity/paternity/adoption leave duration validated against statutory minimums where the tenant enables statutory-compliance guardrails (configurable warning, not necessarily a hard block, since exact entitlement can have case-specific nuance — **flagged for legal review**, not asserted as a hard rule here).

## 12. Permission requirements

Employees see only their own balance/history; Managers see direct/dotted-line reports' leave within scope, not balance detail beyond what's needed for approval decisions (e.g., a manager approving leave doesn't necessarily need to see the exact numeric balance of every leave type, just whether sufficient balance exists — a genuine, debatable privacy design choice, flagged as an open question below rather than asserted).

## 13. Approval workflows

Single or multi-level per Module 17, with delegated-approval support (a manager on leave delegates their approval authority — links to [05](../05-organisation-data-model.md) §5's Acting Manager concept) and configurable auto-approval-below-threshold (e.g., single-day casual leave with sufficient balance auto-approves).

## 14. Statuses and state transitions

| State | Entry condition | Allowed actions | Next states |
|---|---|---|---|
| Draft | Employee begins application, not submitted | Edit, discard | Submitted |
| Submitted / Pending Approval | Submitted to approver(s) | Approve, reject, return for correction, employee-withdraw | Approved, Rejected, Returned, Withdrawn |
| Partially Approved | Multi-level chain, one level approved, awaiting next | Continue chain | Approved, Rejected |
| Approved | All required approvals complete | Cancel (employee/manager), extend | Cancelled, (leave taken — no explicit further state needed) |
| Rejected | Any approver rejects | Employee may resubmit as new request | (terminal) |
| Returned for Correction | Approver requests changes | Employee edits, resubmits | Submitted |
| Withdrawn | Employee withdraws before approval completes | — | (terminal) |
| Cancelled | Approved leave cancelled before/during | Balance credited back per §7.2 rules | (terminal) |

Every state transition: balance impact (debit on Submitted for pending-hold purposes or on Approved, per tenant policy — configurable which point triggers the hold), notification, audit event, per the brief's own state-machine documentation requirement.

## 15. Record detail-page requirements

Leave request detail page: request details, approval-chain history (who approved/rejected/when, with comments), balance-impact snapshot (before/after), linked attendance-record adjustment (Module 4 coordination), cancellation/extension history if applicable.

## 16. Search, filter and sorting requirements

Team/org leave views filterable by date range, department, leave type, status; leave-balance report filterable/sortable by employee, leave type, balance-remaining.

## 17. Bulk-action requirements

Bulk leave-request approval (for managers clearing multiple straightforward requests); bulk balance adjustment (e.g., a policy-correction event affecting many employees at once, with a shared reason_code per the reorg-batching pattern established in [05](../05-organisation-data-model.md) §9).

## 18. Import and export requirements

Historical leave-balance import (for migration from a competitor product — a realistic onboarding scenario for this HRMS given the competitive-displacement positioning in [03-product-vision.md](../03-product-vision.md)); export for payroll/statutory/audit.

## 19. Notification requirements

**In-app/email:** application submitted/approved/rejected/returned, balance-low warning (configurable threshold), year-end-closure preview available for HR review, carry-forward/expiry summary to employees before it happens (transparency — no silent expiry). **Mobile push:** approval-pending alert to managers (high-frequency, per Module 04 persona notes), approval-decision alert to employees.

## 20. Mobile requirements

Employee: apply, view balance/history/status — high-frequency mobile use. Manager: approval inbox with team-calendar context — one of the two highest-priority mobile approval flows in the product alongside attendance regularisation (per [04-personas-and-roles.md](../04-personas-and-roles.md)).

## 21. Reporting requirements

Leave utilisation by type/department, leave liability (outstanding encashable balance — a genuine balance-sheet-relevant number for Finance), leave-balance-adjustment audit report, sandwich-rule/blackout-override report (compliance visibility into how often exceptions are granted).

## 22. Audit-log requirements

Every application/approval/rejection/cancellation/extension, every balance adjustment (mandatory reason captured, per §7.1's business rule), every year-end closure — per Phase 11.

## 23. Integration requirements

Module 4 (Attendance — a day marked as approved leave should not simultaneously flag as an attendance exception); Module 6 (Payroll — LOP and encashment input); Module 17 (approval routing).

## 24. Error, empty, and edge cases

**Error states:** insufficient balance with negative leave disabled (clear block, not a confusing partial-submission state); blackout-period conflict without override permission (clear block with the policy reason shown, not a generic rejection). **Empty states:** new employee with no accrued balance yet (before their first accrual cycle) should show a clear "balance available from [date]" state, not a bare zero that looks like an error. **Edge cases:** leave spanning a leave-year-end boundary (accrual/carry-forward calculation must handle correctly, not double-count or drop days); an employee who transfers between Leave Policy Groups mid-year (per [05](../05-organisation-data-model.md) §3, a policy-group change) — balance-reconciliation rules for this case need explicit definition, not left implicit; maternity/paternity leave overlapping a probation period (interacts with Module 3's confirmation timeline — flagged as a cross-module edge case).

## 25. Acceptance criteria

Given a leave-year closure has run, when an employee checks their balance the next day, then it correctly reflects carried-forward, encashed, and expired amounts with a visible breakdown (not just a single opaque new-balance number) so the employee can verify the arithmetic themselves.

## 26. Dependencies

Module 1 (Leave Policy Group assignment), Module 4 (attendance coordination), Module 6 (payroll — LOP/encashment), Module 17 (approval workflows).

## 27. Risks

Leave-accrual/carry-forward arithmetic errors are high-visibility, trust-eroding, and (for encashment) directly payroll-affecting — this module warrants disproportionate QA/testing investment relative to its apparent simplicity, a specific risk worth flagging rather than assuming "it's just a balance counter."

## 28. Open questions

- Should managers see exact numeric leave balances of their reports, or only a sufficiency indicator? Flagged in §12 — a genuine privacy-vs-utility tradeoff needing a product decision, not a research answer.
- Statutory minimums for maternity/paternity/adoption/bereavement leave, and how strictly the system should enforce vs. merely warn — **explicitly needs input from a qualified labour-law professional**, per the brief's own instruction not to invent compliance answers.

## 29. Release scope

**MVP:** all leave types listed above, configurable policy engine, application/approval with team-calendar context, half-day/hourly leave, year-end closure, payroll integration for LOP/encashment.
**Later phase:** AI-assisted leave-pattern/burnout-risk signals (Module 25), advanced blackout-period visualisation across the org.
**Out of scope:** this module does not manage non-leave absence types like jury duty or bereavement-adjacent HR-case handling beyond the leave record itself (those may intersect with Module 12's Helpdesk/HR-case handling, not duplicated here).
