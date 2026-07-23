# Module 15 — Employee Separation and Offboarding

**Status:** Draft v1 (pending stakeholder review — settlement/statutory aspects need qualified payroll/legal sign-off) · **Release:** HR Operations
**Depends on:** Module 1 (Core HR), Module 5 (Leave — encashment), Module 6 (Payroll — full & final settlement), Module 14 (Assets — recovery), Module 13 (Documents — relieving/experience letters), Module 17 (Workflow Engine)

---

## 1. Module overview

Everything from resignation/termination initiation through last working day, exit checklist, knowledge transfer, access revocation, final settlement, exit interview, and alumni status — the mirror image of Module 3's onboarding, and equally cross-functional.

## 2. Problem statement

Offboarding is high-risk in a way onboarding isn't: a mishandled separation creates real legal exposure (notice-period disputes, incorrect final settlement), security exposure (access not revoked promptly), and financial exposure (unrecovered assets, incorrect gratuity/leave-encashment calculation). Getting the *timing coordination* right — access revocation exactly when it should happen, not early (disrupting a still-working employee) or late (a security gap) — is a specific, evidenced-important detail.

## 3. Business objective

Give HR a complete, auditable exit checklist spanning every affected module, ensure access revocation is tightly and correctly timed to the actual last working day (not manually coordinated between HR and IT), and produce a correct, defensible final settlement.

## 4. User personas

Primary: **HR Executive** (process the separation), **Employee** (initiate resignation, complete exit steps). Secondary: **People Manager** (approve/acknowledge, knowledge-transfer coordination), **IT Administrator** (access revocation, timed per §7.3), **Payroll Administrator** (final settlement sign-off), **HR Administrator** (termination/absconding cases, requiring more oversight than a routine resignation).

## 5. User needs

Employee needs a clear, respectful, well-communicated exit process even in a resignation they initiated themselves. Manager needs a structured knowledge-transfer checklist, not an informal handoff that depends on memory. IT needs precise, automatic timing for access revocation rather than a manual reminder that might be missed or acted on too early/late. Payroll Administrator needs confidence the final settlement calculation is complete and correct before releasing payment.

## 6. Primary use cases

Employee-initiated resignation; manager-initiated/HR-initiated separation (including termination, absconding, retirement, contract completion); notice-period management (including waiver/recovery); exit checklist across departments; knowledge transfer; asset recovery (Module 14); access revocation; leave/loan adjustment; final payroll settlement; exit interview; relieving/experience letter generation (Module 13); rehire-eligibility flagging; alumni-status transition; data-retention handling.

## 7. Detailed workflows

### 7.1 Employee-initiated resignation through last working day

- **Trigger:** Employee submits resignation.
- **Preconditions:** Employee is Active.
- **Steps:** 1) Employee submits resignation with intended last working day and reason (optional/confidential) 2) Routed to manager for acknowledgement (not necessarily "approval" — a resignation is the employee's right, but the *proposed last working day* may be subject to negotiation against the notice-period policy) 3) System calculates the notice-period-compliant last working day per policy (employment type/grade/tenure-dependent) and flags any gap between the employee's proposed date and the policy-compliant date 4) HR/Manager and employee reconcile the final last working day (with a defined path for notice-period waiver — mutual agreement to shorten, or notice-period recovery — a payroll deduction for a shortfall, both requiring HR Administrator approval given financial/legal implications) 5) Once the last working day is confirmed, the full exit checklist (§9) is instantiated across all relevant modules 6) Employee record status moves to "Separation-Initiated" (Module 1 §14) with the confirmed last working day recorded.
- **Decision points:** Notice-period shortfall → waiver (no deduction) or recovery (deduction, feeds Module 6 §7.4) — a required, explicit decision, not a default assumption either way.
- **Approval logic:** Notice-period waiver/recovery decisions require HR Administrator sign-off (Module 17); routine resignation acknowledgement doesn't need HR Administrator involvement beyond checklist processing.
- **Notifications:** Manager, HR, IT (advance notice for provisioning access-revocation timing, §7.3), Payroll (advance notice for settlement preparation).
- **Failure handling:** Employee withdraws resignation before last working day — explicit, supported path, reverting status to Active and cancelling in-flight exit-checklist items (not leaving them dangling).
- **Audit events:** `SeparationInitiated`, `NoticePeriodDecisionRecorded`.

### 7.2 Manager-initiated separation, termination, and absconding

- **Trigger:** Manager/HR initiates separation for cause, performance (post-PIP per Module 9), redundancy, or the employee has stopped reporting for work without communication (absconding).
- **Steps:** Similar structure to §7.1 but with **mandatory HR Administrator involvement from the start** (not just for notice-period exceptions), given the legal sensitivity — documented justification required, and (flagged, not asserted) likely a legal/compliance review step depending on jurisdiction and cause. Absconding cases follow a distinct sub-flow: a defined "no-contact" grace period, documented attempts to reach the employee, before the separation is formally recorded — this protects both the employee (against a premature/erroneous termination-for-absconding) and the company (a clear, defensible record).
- **Audit events:** `SeparationInitiated` (with type = Termination/Absconding/Redundancy, distinctly tagged from resignation for reporting and legal-defensibility purposes).

### 7.3 Access revocation timing

- **Trigger:** Last working day arrives (or, for a for-cause termination with immediate effect, the termination-effective timestamp).
- **Steps:** 1) System fires an access-revocation event to IT Administrator/Module 23 integrations at the precise configured moment (e.g., end of last working day, or immediately for an immediate-termination case — tenant/case-type-configurable, not a single hard-coded rule) 2) IT systems (SSO, email, application access per Module 23 integrations) receive the revocation trigger 3) Confirmation of revocation completion is tracked back in this module's exit checklist (§9), giving HR visibility that the security-critical step actually completed, not just that it was requested.
- **Failure handling:** A revocation-integration failure must alert IT Administrator distinctly and promptly (a security gap, not a routine checklist delay) — this is one of the few places in the whole product where an integration failure should be treated as urgent/high-priority by default, not just logged for later review.
- **Audit events:** `AccessRevocationTriggered`, `AccessRevocationConfirmed` — this pairing (trigger vs. confirmed-complete) matters, since a fired event isn't proof the downstream system actually acted on it.

## 8. User stories

**US-1**
As an **IT Administrator**, I want access revocation to fire automatically and precisely at an employee's last working day (or immediately for a for-cause termination), so that I'm not relying on someone remembering to tell me, and so access isn't cut prematurely for someone still working out their notice.
**Acceptance criteria:** Given an employee's last working day is confirmed, when that date/time arrives, then the access-revocation event fires automatically without requiring a manual trigger; given a termination is marked immediate-effect, when HR confirms it, then revocation fires immediately rather than waiting for an end-of-day batch process.

**US-2**
As a **Payroll Administrator**, I want the full-and-final settlement to reflect confirmed asset-recovery and leave-encashment status before I approve payment, so that I'm not signing off on an incomplete or incorrect calculation.
**Acceptance criteria:** Given an employee has an outstanding, unreturned high-value asset, when the Payroll Administrator reviews the final settlement, then the outstanding-asset status is visible in the settlement review (not hidden in a separate module), even if company policy ultimately allows settlement to proceed despite it.

## 9. Functional requirements

Resignation, manager-initiated separation, retirement, contract completion, termination, absconding (§7.1/§7.2) as distinct, appropriately-differentiated flows; separation approval (Module 17); notice period with waiver/recovery (§7.1); last-working-day determination; exit checklist spanning department/IT/finance/manager/asset-recovery items; knowledge-transfer checklist; asset recovery (Module 14 §7.2); access revocation with precise timing (§7.3); leave adjustment/encashment (Module 5 §9); loan recovery (Module 6 §9); final payroll settlement (Module 6 §7.4); gratuity calculation; exit interview (structured, optionally anonymous for candid feedback — consider the same anonymity-enforcement rigor as Module 11 §7.1 if promised); relieving and experience letters (Module 13); rehire-eligibility flag (feeding Cross-Module Workflow #17); alumni status and data-retention handling (§10).

## 10. Business rules

Employee record transitions to a terminal "Separated" status (Module 1 §14) only after the full exit checklist's mandatory items are complete — configurable which items are mandatory-blocking vs. informational, but access revocation and final settlement should default to mandatory. Post-separation, the employee's historical data is retained per a configured data-retention policy (Phase 11), transitioning toward alumni status (rehire-eligible, limited-visibility) rather than deletion, absent a specific legal deletion request (Cross-Module Workflow #25).

## 11. Validation rules

Last working day cannot be set before the resignation-submission date (obvious but must handle backdated/administrative corrections distinctly, per the same correction-path philosophy as Module 1 §7.3); final settlement calculation cannot be marked complete with any mandatory input (leave balance, loan balance, asset status) still unresolved.

## 12. Permission requirements

Separation-initiation for termination/absconding cases requires HR Administrator tier, not HR Executive (§7.2); resignation acknowledgement is Manager/HR Executive tier; final-settlement approval is Payroll Administrator tier (same segregation-of-duties principle as Module 6).

## 13. Approval workflows

Notice-period waiver/recovery (HR Administrator); termination/absconding initiation (HR Administrator, potentially with a legal/compliance co-sign depending on jurisdiction — flagged, not asserted); final settlement (Payroll Administrator, per Module 6 §13's two-role pattern).

## 14. Statuses and state transitions

| State | Entry condition | Next states |
|---|---|---|
| Initiated | Resignation/termination recorded | Notice-Period-In-Progress, Withdrawn |
| Notice-Period-In-Progress | Last working day confirmed | Exit-Checklist-In-Progress, Withdrawn (employee reverses resignation) |
| Exit-Checklist-In-Progress | Last working day reached, checklist active | Settlement-Pending |
| Settlement-Pending | Checklist substantially complete, awaiting final payroll processing | Separated |
| Separated (terminal) | Settlement processed, Module 1 status updated | Alumni (ongoing, not really a "next state" so much as the long-term resting status) |

## 15. Record detail-page requirements

Separation detail page: type (resignation/termination/etc.), timeline (initiated → last working day → settlement), full exit checklist across all modules (a genuine single-pane view — the primary UX promise of this module per §3), settlement calculation breakdown, exit-interview status, rehire-eligibility flag with reason if not eligible.

## 16. Search, filter and sorting requirements

Separations list filterable by type, status, department, date range — useful for both HR operations and Module 19's attrition-analytics source data.

## 17. Bulk-action requirements

Bulk separation processing for a genuine mass-layoff/redundancy event (a real, if hopefully rare, scenario that shouldn't be forced through a one-at-a-time UI) — same batch/reason_code/preview-before-commit pattern as [05-organisation-data-model.md](../05-organisation-data-model.md) §9's reorg-event handling.

## 18. Import and export requirements

Settlement-calculation export for record-keeping/audit; separations data feeds Module 19's attrition reporting.

## 19. Notification requirements

**In-app/email:** resignation acknowledged, checklist item assigned/overdue, last-working-day reminder (to all exit-checklist stakeholders), settlement processed, relieving letter available. **Mobile push:** checklist-item reminders to managers/IT (time-sensitive given §7.3's precision requirement).

## 20. Mobile requirements

Employee: submit resignation, complete exit-interview survey, view relieving letter. Manager: exit checklist (knowledge-transfer items). Low priority for the settlement-calculation/approval steps (desktop, same risk-based reasoning as Module 6 §20).

## 21. Reporting requirements

Attrition rate and trend (feeds Module 19's leadership dashboard), separation-type breakdown (voluntary vs. involuntary), notice-period-compliance report, exit-checklist completion-time report, exit-interview sentiment/theme analysis, rehire-eligibility report.

## 22. Audit-log requirements

Every separation-type decision, notice-period waiver/recovery, access-revocation trigger/confirmation, settlement calculation and approval — per Phase 11; this module's audit trail is second only to Module 6's in likely legal/audit scrutiny (wrongful-termination disputes, notice-period disputes).

## 23. Integration requirements

Module 1 (status transition), Module 5 (encashment), Module 6 (settlement), Module 13 (letters), Module 14 (asset recovery), Module 23 (access-revocation triggers to SSO/IT systems, §7.3 — this integration's reliability is a genuine security-relevant dependency, not just a convenience feature).

## 24. Error, empty, and edge cases

**Error states:** access-revocation integration failure (§7.3's failure-handling — urgent alert, not silent). **Empty states:** N/A (every separation has by definition at least the initiating event). **Edge cases:** an employee who resigns and is later rehired before their original last working day arrives (a genuine edge case — the withdrawal path in §7.1 should handle this cleanly); a termination that's later disputed/reversed (needs an explicit, audited reversal path, not a manual database fix — flagged as an open question below); an absconding case where the employee later returns/contacts the company (interacts with the rehire-eligibility flag and the formal absconding-determination process in §7.2).

## 25. Acceptance criteria

Given a separation's last working day arrives, when the access-revocation event fires, then IT systems receive it within the configured SLA window (a genuine near-real-time requirement, not a batch-overnight-job tolerance, given the security implications) — see Phase 12 NFRs for the specific timing target.

## 26. Dependencies

Module 1, Module 5, Module 6, Module 9 (PIP-to-termination linkage), Module 13, Module 14, Module 17, Module 23.

## 27. Risks

This module carries real legal-exposure risk (wrongful termination, notice-period disputes, incorrect settlement) — more than almost any other module besides Payroll. The termination/absconding sub-flows in particular should be reviewed by qualified employment-law counsel before being finalised as product behaviour, not just designed from first principles by this PRD.

## 28. Open questions

- Formal reversal path for a disputed/incorrectly-processed termination — needs explicit design, not assumed to be a manual data-fix. **Flagged for both product design and legal review.**
- Jurisdiction-specific legal-review requirements for termination-for-cause cases (§7.2) — **needs qualified employment-law input**, not invented here, consistent with the brief's own instruction.

## 29. Release scope

**MVP:** resignation, manager-initiated separation, termination, notice-period management, full exit checklist (cross-module), access revocation timing, final settlement, relieving/experience letters, alumni status.
**Later phase:** structured/anonymised exit-interview analytics, bulk/mass-separation handling refinement, AI-assisted attrition-risk correlation with exit-interview themes (Module 25).
**Out of scope:** this module does not itself provide legal counsel or generate legally-reviewed termination documentation without qualified human review — it orchestrates the process and generates from HR-approved templates (Module 13), it does not replace legal judgment.
