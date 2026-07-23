# Build Guide — Module 7: Reimbursements and Expenses

**Full spec:** [modules/07-reimbursements-expenses.md](../../hrms-prd/modules/07-reimbursements-expenses.md)
**Phase:** Payroll, build alongside/after Module 6 (this module's whole reason for existing is feeding clean data into a payroll run).

---

## What this module is, in one paragraph

Employees submit expense claims (usually a photo of a receipt), someone checks them against policy, and approved claims get paid — either through the next payroll run or as a direct payout. Lower risk than Module 6, more of a "make it fast and reliable" problem than a "get the math exactly right" problem.

## Screens to build

1. **Submit a Claim** — category, amount, date, receipt photo. Run the photo through OCR to pre-fill amount/date/vendor, but always show the employee the extracted values before submitting — never auto-submit based on OCR alone, since it will sometimes misread something.
2. **My Claims** — status, history.
3. **Approval** — reuses Module 17/16's approval pattern. Add a **duplicate-receipt check** before it even reaches an approver: same amount, same date, same employee, similar receipt image → flag and block, with a link to the original claim.
4. **Finance Review** (for claims above a configurable amount threshold — a second approval step beyond the manager) — same screen pattern as manager approval, different queue.
5. **Cash Advance** request — a simpler variant, offset against future claims.

## Key user flow: submit → pay

1. Employee photographs a receipt, OCR extracts amount/date/vendor, employee confirms or corrects, submits.
2. System checks: policy limits for that category, duplicate-receipt match. Policy violations either block or just flag-with-required-justification, depending on tenant configuration — don't hard-code one behaviour.
3. Manager approves (auto-escalates to Finance if above the amount threshold).
4. Approved claim gets tagged for payout: either "next payroll cycle" (queued as a `payroll_input` for Module 6 to pick up automatically) or "direct payout" (a separate banking transaction via Module 23).
5. If payroll-routed: when the next payroll run collects inputs, this claim's amount just shows up, correctly tax-treated per its category — no manual step for the payroll team.

## Data model

`expense_categories`, `reimbursement_policies` (limits per category), `expense_claims` (status, OCR-extracted vs. confirmed values — keep both, don't overwrite), `cash_advances`.

## API endpoints

```
GET/POST/PATCH  /api/v1/expense-categories, /reimbursement-policies
POST            /api/v1/expense-claims                — includes OCR call
GET             /api/v1/expense-claims?employeeId=&status=
PATCH           /api/v1/expense-claims/:id/approve, /reject, /return
POST            /api/v1/expense-claims/:id/flag-duplicate  — internal, runs automatically on submit
POST            /api/v1/cash-advances
```

## Components

`@atlaskit/form` + a camera/file-upload component for claim submission, `@atlaskit/dynamic-table` for claims lists, standard approval-inbox integration for the review step.

## What "done" looks like

- Submit a claim with a receipt photo, confirm OCR pre-fills the amount/date reasonably and the employee can correct it before submitting.
- Submit the same receipt twice, confirm the second attempt is blocked with a link to the original.
- Approve a claim configured for payroll routing, run the next Module 6 payroll preview, confirm the amount appears automatically with correct tax treatment — no manual re-entry.
