# Module 14 — Asset Management

**Status:** Draft v1 (pending stakeholder review) · **Release:** Enterprise
**Depends on:** Module 1 (Core HR), Module 3 (Onboarding — allocation trigger), Module 15 (Separation — recovery trigger)

---

## 1. Module overview

Asset inventory, assignment/transfer/return, condition tracking, and the specific coordination with Onboarding (allocate on day one) and Separation (recover before/at exit) that makes this genuinely HR-relevant rather than a generic IT-asset tool. Phase 2 research found this handled via third-party partnership even by an enterprise competitor (Darwinbox's Workwize integration) rather than built natively — a signal that this module should be solid but not over-invested relative to core HR/Payroll differentiation.

## 2. Problem statement

Asset recovery at exit is a specific, evidenced HR-process risk (an unreturned laptop is a real cost and a genuine full-and-final-settlement blocker) that's poorly served when asset tracking lives in a disconnected IT system with no link to the separation workflow.

## 3. Business objective

Ensure every asset assigned to an employee is tracked with a clear owner and condition history, and that asset recovery is a first-class, blocking (or at least clearly visible) step in the separation process — not an afterthought discovered only when someone notices a laptop never came back.

## 4. User personas

Primary: **HR Executive** (assignment/recovery processing), **IT Administrator** (asset inventory/condition, though scoped away from broader HR data per [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 11's least-privilege principle). Secondary: **Employee** (acknowledge receipt, report issues), **People Manager** (approve team asset requests where applicable).

## 5. User needs

HR needs asset-recovery status visible directly within the separation checklist (Module 15), not a separate lookup. IT needs an accurate inventory without needing broad HR-data access to maintain it (a genuine permission-design tension worth being explicit about — see §12).

## 6. Primary use cases

Assign an asset to an employee (with acknowledgement); transfer an asset between employees; track asset condition/repair/replacement; process asset return (at exit or otherwise); manage software-licence assignment; view asset history/audit trail.

## 7. Detailed workflows

### 7.1 Asset assignment with acknowledgement

- **Trigger:** New-hire onboarding checklist item (Module 3) or an ad-hoc assignment.
- **Steps:** 1) HR/IT selects asset from inventory, assigns to employee, records condition at time of assignment (with photo evidence, recommended for high-value assets) 2) Employee acknowledges receipt (digital signature, linking to Module 13's e-signature infrastructure) 3) Asset status updates to "Assigned," linked to the employee's Module 1 record (visible on the Employee Detail page's Assets tab per Module 1 §15).
- **Audit events:** `AssetAssigned`.

### 7.2 Asset recovery at exit

*(Full cross-module detail in [06-cross-module-workflows.md](../06-cross-module-workflows.md) Workflow #15 — this section is this module's contribution to Module 15's exit checklist.)*

- **Trigger:** Employee's separation process initiated (Module 15).
- **Steps:** 1) System auto-generates an asset-recovery checklist item listing every asset currently assigned to the employee 2) HR/IT confirms return and records condition at return 3) Any damage/loss is flagged and can trigger a recovery-cost deduction request to Module 6's full-and-final settlement calculation (Module 6 §7.4) 4) On full recovery confirmation, this checklist item clears, which Module 15's exit-checklist logic can use as a gating condition for final settlement release (configurable — some tenants may want asset non-return to delay settlement, others may not; this module supplies the status, Module 15/17 decide the policy).
- **Failure handling:** Unreturned asset past the last working day should escalate (to HR Administrator, and potentially trigger a recovery-cost deduction per policy), not silently remain "pending" indefinitely.
- **Audit events:** `AssetReturned`, `AssetLossRecorded` (with cost-recovery linkage where applicable).

## 8. User stories

**US-1**
As an **HR Executive**, I want to see an employee's outstanding asset-recovery status directly within their exit checklist, so that I don't need to separately check with IT before finalising a settlement.
**Acceptance criteria:** Given an employee has one unreturned asset at their last working day, when HR views the Module 15 exit checklist, then the outstanding asset is visible with its recovery status inline, not requiring a separate IT lookup.

## 9. Functional requirements

Asset categories and inventory with serial-number tracking; assignment with acknowledgement (§7.1); transfer between employees; condition tracking, repair, and replacement records; return processing (§7.2) with recovery-cost linkage to Module 6; software-licence assignment tracking; asset history per item and per employee; asset reports.

## 10. Business rules

An asset cannot be reassigned to a new employee while still marked "Assigned" to a prior employee without an explicit transfer/return action — no silent overwrite of ownership.

## 11. Validation rules

Serial number, where applicable, must be unique within the tenant's inventory (duplicate-asset detection, same principle as Module 1's government-ID uniqueness check).

## 12. Permission requirements

IT Administrator needs asset-inventory/condition access but, per [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 11's least-privilege principle, should not need broader HR-content access just to manage assets — the asset-employee linkage should be exposed narrowly (which employee holds which asset) without granting IT Administrator general Module 1 record access. This is a concrete design test of that principle, not just an abstract statement.

## 13. Approval workflows

High-value asset assignment may require manager/budget approval (Module 17, tenant-configurable); asset write-off (loss/damage beyond repair) typically requires HR Administrator or Finance sign-off given the cost implication.

## 14. Statuses and state transitions

**Asset:** In Inventory → Assigned → Under Repair → Assigned (returned to service) / Lost / Written Off → Returned → In Inventory (cycle repeats for reassignment).

## 15. Record detail-page requirements

Asset detail page: full history (every assignment, condition change, repair), current holder, linked acknowledgement document. Employee's Assets tab (Module 1 §15): current and historical assignments for that employee.

## 16. Search, filter and sorting requirements

Inventory searchable/filterable by category, status, assigned-employee, location.

## 17. Bulk-action requirements

Bulk asset assignment (e.g., a hardware refresh cycle affecting many employees at once).

## 18. Import and export requirements

Asset-inventory bulk import (initial setup or migration); asset-recovery-status export for exit-processing reporting.

## 19. Notification requirements

**In-app/email:** asset assigned (acknowledgement request), return reminder approaching last working day, recovery-cost-flagged (to Payroll/Finance).

## 20. Mobile requirements

Employee: acknowledge asset receipt (relevant at onboarding, which may happen partly via mobile). Low priority otherwise — this is a largely desktop/IT-operations module.

## 21. Reporting requirements

Asset-utilisation and ageing report, recovery-rate-at-exit report (an operational-health metric worth tracking given §2's stated risk), software-licence-compliance report.

## 22. Audit-log requirements

Every assignment/transfer/return/condition-change/write-off — per Phase 11.

## 23. Integration requirements

Module 3 (assignment trigger), Module 15 (recovery trigger, §7.2), Module 6 (recovery-cost deduction), Module 23 (potential IT-asset-management-system integration for enterprises with an existing dedicated tool — this module should be able to defer to an external system of record for organisations that already have one, rather than forcing a migration).

## 24. Error, empty, and edge cases

**Error states:** attempting to assign an asset already marked "Assigned" elsewhere (block, per §10). **Empty states:** new tenant with no inventory loaded yet. **Edge cases:** an asset lost/stolen (not simply unreturned) — needs a distinct status and process from a routine return, including potential insurance/police-report reference fields (configurable, not assumed universal).

## 25. Acceptance criteria

Given an employee's separation reaches the exit-checklist stage (Module 15), when their assigned-assets list is non-empty, then the exit checklist visibly reflects outstanding recovery items without a separate IT-system lookup.

## 26. Dependencies

Module 1, Module 3, Module 6, Module 15, Module 23.

## 27. Risks

Low differentiation value relative to build effort if over-invested — per §2's finding that even Darwinbox partners rather than builds natively; this module should stay scoped to what's genuinely HR-process-relevant (assignment/recovery tied to lifecycle events) rather than trying to become a full ITAM/MDM platform.

## 28. Open questions

None significant.

## 29. Release scope

**MVP:** basic inventory, assignment/return with acknowledgement, exit-checklist integration (§7.2), condition tracking.
**Later phase:** software-licence-compliance depth, integration with dedicated external ITAM systems for enterprise customers who already have one.
**Out of scope:** device security/MDM (remote wipe, compliance policy enforcement) — explicitly out of scope per [03-product-vision.md](../03-product-vision.md) Product Boundaries (not an IT-security product).
