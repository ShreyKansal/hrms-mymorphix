# Module 7 — Reimbursements and Expenses

**Status:** Draft v1 (pending stakeholder review) · **Release:** Payroll
**Depends on:** Module 1 (Core HR), Module 6 (Payroll — payout routing), Module 17 (Workflow Engine)

---

## 1. Module overview

Expense claim submission, policy enforcement, approval, and payout — either through payroll (Module 6) or direct reimbursement (Module 23 banking integration) — covering travel, mileage, per diem, cash advances, and corporate-card reconciliation.

## 2. Problem statement

None of the eight competitors researched showed strong, differentiated expense-management depth (RazorpayX's WhatsApp-based filing was the one distinctive UX touch found) — this is a lower-differentiation, higher-hygiene module: it needs to work reliably and not be a source of friction, more than it needs to be a standout feature.

## 3. Business objective

Let employees file claims with minimal friction (photo receipt → claim, not manual data entry), give Finance/HR policy-compliant, duplicate-free claims to approve, and route payouts cleanly through either payroll or direct disbursal.

## 4. User personas

Primary: **Employee** (submit claims). Secondary: **People Manager** (approve), **Finance User** (verify, especially above-threshold claims), **Payroll Executive** (payroll-routed payout integration).

## 5. User needs

Employee needs to submit a claim in under a minute for the common case (a receipt photo). Manager needs policy-violation flags surfaced automatically, not something they have to remember to check manually. Finance needs duplicate-detection and audit-ready evidence for every claim above a materiality threshold.

## 6. Primary use cases

Submit expense claim (with receipt); submit mileage/travel/per-diem claim; request cash advance; reconcile corporate-card transactions; approve/reject/return claims; route approved claims to payroll or direct payout; view expense reports.

## 7. Detailed workflows

### 7.1 Standard expense claim submission and approval

- **Trigger:** Employee incurs a reimbursable expense.
- **Steps:** 1) Employee submits claim: category, amount, date, receipt upload (with OCR-assisted field pre-fill from the receipt image) 2) System checks against policy (category eligibility, per-category limits, receipt-required threshold) and flags violations (doesn't necessarily block — policy on hard-block vs. soft-flag is tenant-configurable) 3) System runs duplicate-receipt detection (same receipt image/amount/date/employee combination) 4) Routed to manager approval, with Finance co-approval above a configured amount threshold 5) On approval, claim is queued for payout — either the next payroll cycle (Module 6) or direct reimbursement (Module 23), per tenant configuration and claim type.
- **Decision points:** Policy violation → configurable hard-block or soft-flag-with-justification-required; duplicate detected → hard block with a link to the original claim (never silently double-pay).
- **Failure handling:** Rejected/returned claims go back to the employee with a specific reason, editable and resubmittable.
- **Audit events:** `ReimbursementSubmitted`, `ReimbursementApproved`/`ReimbursementRejected`, `ReimbursementPaid`.

## 8. User stories

**US-1**
As an **Employee**, I want to photograph a receipt and have the amount/date/vendor pre-filled, so that filing a claim takes seconds, not minutes.
**Acceptance criteria:** Given a clear receipt photo is uploaded, when OCR extraction completes, then amount/date/vendor fields are pre-filled and editable (never silently submitted without employee confirmation of the extracted values).

**US-2**
As a **Finance User**, I want duplicate receipts automatically flagged, so that I don't need to manually cross-check every claim against prior submissions.
**Acceptance criteria:** Given a receipt image matches (or is highly similar to) a previously submitted and approved claim, when the new claim is submitted, then it is blocked with a clear reference to the original claim, not silently queued for approval.

## 9. Functional requirements

Expense categories (configurable); reimbursement policies with eligibility rules and per-category limits; claim submission with receipt upload and OCR-assisted extraction; mileage claims (rate-per-distance, configurable); travel claims; per diem (configurable by grade/location); advance requests (cash advances, offset against future claims); corporate-card transaction reconciliation (Module 23 integration, matching card transactions to filed claims); approval workflows with amount-based escalation; policy-violation flagging; duplicate-receipt detection; claim return/rejection with reason; Finance verification step for above-threshold claims; payroll-routed and direct-reimbursement payout paths; expense reports.

## 10. Business rules

Claims above a configured materiality threshold require Finance co-approval in addition to manager approval. Cash advances must be offset against a future claim or recovered (via payroll deduction, coordinated with Module 6) if unused/unreconciled past a configured period — never left open-ended indefinitely.

## 11. Validation rules

Receipt required above a configured per-category amount threshold (below it, a self-certification may be policy-permitted); claim date must fall within a configurable filing window (e.g., within 90 days of expense) past which late-filing requires HR/Finance override.

## 12. Permission requirements

Employees see only their own claims; Managers see direct/dotted-line reports' claims within approval scope; Finance sees claims above the co-approval threshold org-wide (or per legal entity, per Module 21 scope).

## 13. Approval workflows

Manager approval (standard); Finance co-approval (above-threshold, §10); return-for-correction as a first-class outcome distinct from outright rejection (per the brief's own state-machine guidance).

## 14. Statuses and state transitions

Draft → Submitted → Pending Approval → (Manager) Approved/Rejected/Returned → (if above threshold) Pending Finance Verification → Finance Approved/Rejected → Queued for Payout → Paid. Each transition notified and audited per the pattern established in Modules 4/5.

## 15. Record detail-page requirements

Claim detail page: claim details, receipt image(s), OCR-extracted vs. employee-confirmed values (both shown, for transparency), approval-chain history, policy-check results, payout status/method/date.

## 16. Search, filter and sorting requirements

Filterable by employee, category, date range, status, amount range; sortable by amount/date/status — relevant for Finance's periodic review workflows.

## 17. Bulk-action requirements

Bulk approval for managers clearing multiple low-risk/low-amount claims at once; bulk export for Finance reconciliation.

## 18. Import and export requirements

Corporate-card transaction import (Module 23, bank/card-issuer feed); expense-report export for Finance/accounting reconciliation.

## 19. Notification requirements

**In-app/email:** claim submitted/approved/rejected/returned, payout processed, advance-recovery-due reminder. **Mobile push:** approval-pending alert to managers.

## 20. Mobile requirements

Employee: claim submission with camera-based receipt capture is a first-class, high-value mobile use case (this is where the expense happens — at a client site, on travel). Manager: approval, similar priority to leave/attendance approvals.

## 21. Reporting requirements

Expense reports by category/department/employee, policy-violation frequency report, advance-outstanding report, corporate-card-reconciliation-exception report.

## 22. Audit-log requirements

Every claim submission/approval/rejection/payout, every policy-override, every duplicate-detection event — per Phase 11.

## 23. Integration requirements

Module 6 (payroll-routed payout), Module 23 (direct-reimbursement banking, corporate-card feed, OCR service).

## 24. Error, empty, and edge cases

**Error states:** OCR extraction failure (fall back cleanly to manual entry, never block submission entirely on an OCR failure). **Empty states:** no claims yet for a new employee — clear "submit your first claim" prompt. **Edge cases:** a claim submitted against an expense category that's since been deactivated (should remain viewable/processable for claims already in flight, not break); multi-currency claims for employees on international travel (exchange-rate handling — flagged as an open question below, relevant given the product's multi-country-readiness mandate).

## 25. Acceptance criteria

Given a claim is approved and routed to payroll, when the next payroll run processes (Module 6 §7.1), then the reimbursement amount appears correctly as a non-taxable (or appropriately taxed, per category) payroll input without manual re-entry.

## 26. Dependencies

Module 1, Module 6, Module 17, Module 23.

## 27. Risks

OCR accuracy is a genuine, evaluatable vendor-dependency risk (Module 23) — poor extraction quality would undermine the core "seconds, not minutes" value proposition (§8 US-1).

## 28. Open questions

- Multi-currency claim handling and exchange-rate-source policy — needed given the multi-country-readiness architectural mandate, but not urgent for India-only MVP; flagged for Later Phase scoping.

## 29. Release scope

**MVP:** claim submission with OCR receipt extraction, policy checks, duplicate detection, manager + Finance approval, payroll-routed and direct payout, cash advances.
**Later phase:** corporate-card auto-reconciliation, multi-currency support, per-diem automation by travel-itinerary integration.
**Out of scope:** this module does not manage corporate travel booking itself — it reconciles the resulting expenses (a travel-booking module is out of scope for this HRMS entirely, per [03-product-vision.md](../03-product-vision.md) Product Boundaries).
