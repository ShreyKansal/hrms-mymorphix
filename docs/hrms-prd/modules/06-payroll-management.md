# Module 6 — Payroll Management (India-first)

**Status:** Draft v1 (pending stakeholder review — **this module requires qualified payroll/legal/CA sign-off before implementation**, more than any other module in this PRD) · **Release:** Payroll
**Depends on:** Module 1 (Core HR), Module 4 (Attendance), Module 5 (Leave), Module 7 (Reimbursements), Module 17 (Workflow Engine)

---

## 1. Module overview

Salary structures, payroll processing, statutory compliance (PF, ESI, PT, LWF, TDS, gratuity), payslips, bank-transfer file generation, off-cycle/retroactive processing, full-and-final settlement, and the compliance reporting/audit trail around all of it. This is the highest-stakes module in the entire product — errors here are financially, legally, and reputationally consequential and often hard to reverse once a bank transfer is initiated.

## 2. Problem statement

Phase 2 research found statutory-compliance completeness to be **uneven even among India-native competitors**: RazorpayX explicitly excludes LWF filing and appears to have no gratuity support; greytHR's tier-boundary documentation for compliance features is internally inconsistent; Keka's compliance depth is vendor-asserted without independent audit. No competitor researched has fully transparent, complete, independently-verifiable India statutory documentation. Separately, attendance/leave-to-payroll reconciliation is a near-universal weak point (market research §8).

## 3. Business objective

Process accurate, compliant, on-time payroll every cycle with a fully auditable trail from input to disbursal, built on the unified data model in [05-organisation-data-model.md](../05-organisation-data-model.md) (not a bolted-on, one-way-synced product), with statutory correctness treated as core infrastructure, not an add-on tier.

## 4. User personas

Primary: **Payroll Executive** (input collection, preview, exception handling), **Payroll Administrator** (final process/lock, statutory sign-off). Secondary: **Employee** (payslip/tax-declaration self-service), **Finance User** (cost reconciliation, GL export), **HR Executive/Administrator** (input coordination — transfers/new-hires/exits feeding payroll).

## 5. User needs

Payroll Executive needs confidence that attendance/leave/reimbursement inputs are complete and correct before running preview, and clear visibility into every variance from the prior cycle. Payroll Administrator needs a genuinely safe way to review before an irreversible lock/disbursal action, and a defined rollback path for when something is caught late. Employee needs an accurate payslip and an easy, low-anxiety way to declare tax-saving investments. Finance needs cost data that maps cleanly to their chart of accounts without manual remapping every cycle (a named [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 8 pain point).

## 6. Primary use cases

Configure salary structures/pay components; collect and validate payroll inputs (attendance, leave, reimbursements, one-time payments/deductions); run payroll preview; process and lock a payroll run; generate payslips and bank-transfer files; process off-cycle/bonus runs; process retroactive salary revisions with arrears; process full-and-final settlement on exit; manage loans/advances and recovery schedules; manage employee tax declarations and proof submission; generate statutory reports and track challan/filing deadlines; reconcile payroll cost by cost centre.

## 7. Detailed workflows

### 7.1 Standard monthly payroll run

- **Trigger:** Configured payroll-cycle date (e.g., 25th of the month) reached.
- **Preconditions:** Attendance locked for the period (Module 4 §7.3); leave data finalised (Module 5); reimbursements approved and flagged for payroll (Module 7); no unresolved new-hire/exit records mid-processing without a defined proration rule.
- **Actor:** Payroll Executive (prepares), Payroll Administrator (approves/locks).
- **Steps:** 1) System auto-collects inputs from Attendance/Leave/Reimbursements/one-time entries per employee 2) Payroll Executive reviews an exception report (any employee with an unusual variance vs. prior cycle, missing mandatory data, or a flagged input) 3) Payroll Executive runs Preview — a full calculation (earnings, deductions, statutory contributions, net pay) without committing 4) Preview is reviewed against a variance report (cycle-over-cycle, department-level, and individual-outlier views) 5) Payroll Administrator reviews and either requests corrections (loop back to step 1) or approves 6) On approval, Payroll Administrator executes **Process and Lock** — this is the single most consequential, hardest-to-reverse action in the module and should require step-up confirmation (re-authentication) given the blast radius 7) System generates payslips, bank-transfer file, and statutory-computation records; attendance/leave/reimbursement data for the period is marked as consumed (immutable reference, not deletable).
- **Decision points:** Any employee with a variance beyond a configured threshold (e.g., >20% net-pay change vs. prior cycle) should be a **mandatory** reviewed-and-acknowledged item before lock is permitted, not just a passive report line — this directly targets the "recurring payroll calculation/formula errors requiring escalation" complaint pattern found against greytHR in Phase 2 research.
- **System actions:** Statutory calculation (PF/ESI/PT/LWF/TDS per §9); GL/cost-centre allocation computation; payslip generation; bank-file generation in the configured bank's format (Module 23 integration).
- **Notifications:** Payroll Executive (preview ready), Payroll Administrator (approval pending), employees (payslip published, after lock).
- **Failure handling:** A processing error mid-run (e.g., a statutory-calculation exception for one employee) should not silently corrupt the whole run — the system should isolate the failing record, allow the rest to proceed or hold the full batch per a configurable policy, and never partially lock.
- **Audit events:** `PayrollRunStarted`, `PayrollInputChanged` (per input source), `PayrollRunCompleted`, `PayslipPublished` — see [09-api-and-event-planning.md](../09-api-and-event-planning.md).

### 7.2 Payroll rollback (exceptional case)

- **Trigger:** A material error is discovered after Process-and-Lock but before (or in rare cases, immediately after) bank-transfer execution.
- **Preconditions:** Requires the highest-privilege action in this module — Payroll Administrator, with a mandatory documented reason and (recommended) a second-approver/four-eyes requirement given the financial and legal blast radius.
- **Steps:** 1) Payroll Administrator initiates rollback with justification 2) System evaluates whether bank transfer has already been executed (Module 23 status check) — **if funds have already moved, this is not a simple system rollback**; the workflow must branch into a recovery/correction process (Module 6 §7.3-style off-cycle adjustment) rather than pretending the original transaction can be undone 3) If bank transfer has *not* yet executed, the run reverts to Pending status, all generated payslips are withdrawn (with an employee-facing "your payslip has been temporarily withdrawn for correction" notice, not a silent disappearance) 4) Corrected run proceeds through §7.1 again.
- **Failure handling:** This workflow explicitly should not promise a guarantee it can't keep — see Risks (§27) — rollback after actual fund movement is a financial-recovery problem, not a data-rollback problem, and the product should say so clearly in-UI rather than implying a clean undo.
- **Audit events:** `PayrollRunRolledBack` with full justification, actor, second-approver reference, and bank-transfer-status-at-time-of-rollback recorded explicitly.

### 7.3 Retroactive salary revision with arrears

- **Trigger:** A salary revision (Module 1 §7.2/§8) is approved with an effective date in a past, already-processed payroll period.
- **Steps:** 1) System computes the arrears (difference between what was paid and what should have been paid, for each affected past period, per the new compensation record) 2) Arrears amount is queued as a one-time payment for the next payroll run (or an off-cycle run, per tenant preference) 3) Statutory recalculation is applied where relevant (e.g., PF-contribution impact of a backdated basic-salary change) — this recalculation is genuinely complex and **should be flagged for qualified payroll-professional review of the exact statutory treatment**, not assumed generically correct 4) Payroll Executive reviews the arrears calculation before it's included in a run, same as any other input (§7.1 step 2-3).
- **Audit events:** `RetroactiveSalaryRevisionProcessed`, linked to the originating Module 1 compensation-change record.

### 7.4 Full and final settlement

*(Full cross-module detail in [06-cross-module-workflows.md](../06-cross-module-workflows.md) Workflow #15; this section covers this module's calculation scope.)*

- **Trigger:** Employee's last working day confirmed (Module 15).
- **Steps:** 1) System computes: pro-rated final salary, leave encashment (Module 5 §9), gratuity (if eligible per tenure threshold), bonus pro-ration if applicable, loan/advance recovery (§9), reimbursement payouts (Module 7), less any recoverable dues (notice-period shortfall, asset non-return per Module 14) 2) Payroll Executive reviews the full settlement statement 3) Payroll Administrator approves 4) Settlement processed as an off-cycle payment, with its own payslip-equivalent statement 5) Statutory closure items (final PF/ESI contribution, Form 16 finalisation for the tax year) tracked to completion.
- **Audit events:** `FullAndFinalSettlementProcessed`, with the complete calculation breakdown retained indefinitely (statutory retention requirement, Phase 11).

## 8. User stories

**US-1**
As a **Payroll Administrator**, I want to see a clear variance report before locking a run, so that I catch calculation errors before they become an irreversible bank transfer, not after.
**Acceptance criteria:** Given an employee's net pay varies more than the configured threshold from the prior cycle, when the Payroll Administrator reaches the lock step, then that employee's line item requires an explicit acknowledgement click before lock is permitted — it cannot be silently bypassed by approving the batch as a whole.

**US-2**
As an **Employee**, I want to declare my tax-saving investments and see the real-time impact on my monthly TDS, so that I don't get an unpleasant surprise at year-end.
**Acceptance criteria:** Given an employee submits a new tax declaration with supporting proof, when the next payroll cycle runs, then the TDS calculation reflects the updated declaration, and the employee can see a before/after comparison of their estimated monthly TDS.

**US-3**
As a **Payroll Executive**, I want attendance and leave data to arrive at payroll processing already fully resolved (no nulls, no ambiguity), so that I don't spend the payroll window chasing HR for missing information — directly addressing the attendance-reconciliation weak point found across every competitor in Phase 2 research.
**Acceptance criteria:** Given the attendance lock event (Module 4 §7.3) has fired for the period, when payroll input collection runs, then every active employee has a definitive attendance-derived LOP/present-days value with no manual lookup required.

## 9. Functional requirements

Payroll groups and pay schedules (per [05](../05-organisation-data-model.md) §3); salary structures with configurable earnings/deductions/reimbursement/benefit components, including flexible benefit plans; variable pay, bonuses, incentives, arrears (§7.3); overtime payment (from Module 4 data); loss-of-pay calculation (from Module 4/5 data); leave encashment (Module 5 §9 handoff); joining/exit proration; full-and-final settlement (§7.4); loans and advances with configurable recovery schedules; payroll input collection and approval (§7.1); one-time payments/deductions; payroll preview with variance reporting; process/lock/rollback (§7.1/§7.2); off-cycle payroll; payslip generation and distribution; payroll register; bank-transfer file generation (format per Module 23's banking integrations); accounting/GL journal export (Module 23); cost-centre allocation; salary revision processing (§7.3); compensation-letter generation trigger (Module 13); employee tax declarations and proof submission with real-time TDS-impact preview; **statutory calculations: PF (incl. EPS), ESI, Professional Tax (state-variant), Labour Welfare Fund, TDS (old/new regime), Gratuity (Payment of Gratuity Act formula)**; Form 16 generation (and readiness for its confirmed India renaming/reform trajectory, per Phase 2 research finding — flagged for ongoing regulatory monitoring, not a one-time build); statutory reports and challan-tracking with compliance-deadline calendar (Module 20 tie-in); payroll audit trail; multi-entity payroll consolidation; payroll variance and reconciliation reports.

**Contractor and gig-worker payroll (added 2026-07-23, per [16-product-decision-log.md](../16-product-decision-log.md) D-014's gap remediation):** a distinct processing path for individuals holding a "Contractor"/"Gig" Worker Type ([05](../05-organisation-data-model.md) §3) rather than the standard employee Payroll Group flow — invoice-or-milestone-based payment, TDS-on-contractor-payments deduction (distinct rate/section from employee TDS), no PF/ESI/gratuity applicability by default. **The legal boundary between a genuine contractor and a "disguised employee" for statutory purposes is a real misclassification-exposure risk, flagged for qualified legal review, not assumed safe by this PRD.** Named as a specific opportunity in market research §9 (RazorpayX's contractor payroll is early-access, not GA).

**ESOP / equity compensation administration (added 2026-07-23, same source):** grant/vesting-schedule/exercise-event tracking linked to the employee record (grant data modelled in Module 1), with this module handling only the payroll-relevant tax events (perquisite tax on exercise). No cap-table management, valuation, or plan-design — that stays the tenant's own legal/finance function. **Exact perquisite-tax treatment needs qualified tax-professional confirmation.**

**Statutory registers (named explicitly, added 2026-07-23, same source):** muster roll, register of wages, register of overtime, and other Factories-Act/Shops-and-Establishments-Act-mandated registers, generated from existing Attendance/Payroll data rather than a separately maintained dataset. **Exact formats/applicability vary by state and establishment type and need qualified legal confirmation per tenant.**

**Contractor and gig-worker payroll (added 2026-07-23, per [16-product-decision-log.md](../16-product-decision-log.md) D-014's gap remediation):** a distinct processing path for individuals holding a "Contractor"/"Gig" Worker Type ([05](../05-organisation-data-model.md) §3) rather than the standard employee Payroll Group flow — invoice-or-milestone-based payment (not a fixed monthly salary structure), TDS-on-contractor-payments deduction (distinct rate/section from employee TDS), and no PF/ESI/gratuity applicability by default (since these are employee-specific statutory obligations — **the exact legal boundary between a genuine contractor and a "disguised employee" for statutory purposes is a real, non-trivial compliance risk area, flagged for qualified legal review rather than assumed safe by this PRD**, given misclassification exposure is a recognised risk in Indian labour law). Market research (§9) named India's growing contract/gig workforce as a specific opportunity RazorpayX only partially addresses (contractor payroll listed as early-access, not GA, in that product) — this is a deliberate, evidenced differentiation target, not a speculative addition.

**ESOP / equity compensation administration (added 2026-07-23, same source):** grant, vesting-schedule, and exercise-event tracking linked to the employee record (the grant/vesting data itself is modelled as an Employee-linked entity in Module 1, per that module's amended §9), with this module's own responsibility limited to the **payroll-relevant tax events** — perquisite-tax treatment on exercise and capital-gains-relevant reporting support at sale, where the tenant's own compliance process requires it. This module does **not** perform cap-table management, valuation, or plan-design — those remain the tenant's own legal/finance function, consistent with this PRD's general pattern of integrating with rather than replacing specialised functions (Module 23). **Exact perquisite-tax treatment and reporting obligations need qualified tax-professional confirmation**, not asserted as definitively correct by this PRD.

**Statutory registers (named explicitly, added 2026-07-23, same source):** the specific statutory records Indian labour law requires employers to maintain — muster roll, register of wages, register of overtime, Form A/other Factories-Act- or Shops-and-Establishments-Act-mandated registers depending on the tenant's state and establishment type — generated from the same underlying Attendance/Payroll data already collected, rather than a separately maintained dataset. **Exact register formats and applicability vary by state and establishment type and need qualified legal/compliance confirmation per tenant**, not a single hard-coded national template.

## 10. Business rules

Process-and-Lock is irreversible in the ordinary sense (§7.2 explains why "rollback" after fund movement is a different, harder problem, not a true undo) — the UI must never imply otherwise. Retroactive changes to a locked period always flow through the arrears mechanism (§7.3), never a silent edit to a past, already-paid run. Statutory calculations must be **configurable/updatable independent of a full product release** (a direct response to the "regulatory change lag" risk identified in [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 7's pain points) — statutory rules (PT slabs, PF ceiling, tax slabs) should live in a versioned, effective-dated configuration layer, not hard-coded application logic, so a rate change doesn't require a code deployment.

## 11. Validation rules

Every earning/deduction component must map to a defined statutory treatment (taxable/non-taxable, PF-wages-inclusion, etc.) before it can be used in a live salary structure — no ad-hoc components with undefined statutory behaviour. Bank account details must pass format validation (and ideally penny-drop verification, Module 23) before being used for disbursal. A payroll run cannot be locked while any employee in scope has an unresolved mandatory input (e.g., missing bank details for a new hire) — hard block, not a silent skip.

## 12. Permission requirements

This module has the strictest field/action permission requirements in the product, per [04-personas-and-roles.md](../04-personas-and-roles.md)'s segregation-of-duties notes: Payroll Executive can prepare/preview but not process/lock; Payroll Administrator can process/lock and configure statutory rules; both roles' access to bulk compensation/bank/statutory data is itself logged (privileged-access monitoring, Phase 11) as a designed exception to general field-masking, not evidence that broad access is fine elsewhere. Finance User gets read-only, cost-aggregated access without individual compensation line items by default (configurable).

## 13. Approval workflows

Payroll run: Payroll Executive prepares → Payroll Administrator approves/locks (mandatory two-role separation, not optional, given the financial-control importance). Off-cycle/bonus runs and retroactive-revision batches: same two-role pattern. Loan/advance approval: configurable threshold-based (Module 17).

## 14. Statuses and state transitions

| State | Entry condition | Allowed actors | Next states | Payroll-specific notes |
|---|---|---|---|---|
| Draft | New run created for the cycle | Payroll Executive | Input Collection | — |
| Input Collection | Inputs being gathered/validated | Payroll Executive | Preview Ready | Cannot skip to Preview with unresolved mandatory inputs |
| Preview Ready | Calculation run, not committed | Payroll Executive, Payroll Administrator | Input Collection (if corrections needed), Pending Approval | Fully re-runnable, no side effects yet |
| Pending Approval | Submitted for lock decision | Payroll Administrator | Locked, Input Collection (returned) | Variance-acknowledgement gate (§8 US-1) applies here |
| Locked | Processed, payslips generated | — (system + downstream) | Disbursed, Rolled Back (exceptional, §7.2) | Immutable in the ordinary path |
| Disbursed | Bank transfer executed | — | (terminal for the cycle) | Rollback after this point is a recovery process, not a state transition (§7.2) |
| Rolled Back | Exceptional correction path | Payroll Administrator (dual-approved) | Input Collection | Only reachable pre-disbursal in the clean case |

## 15. Record detail-page requirements

Payroll run detail page: header (period, status, total headcount/gross/net), tabs for Input Summary (by source module), Exceptions/Variances (the mandatory-review list from §7.1), Employee-level Register (searchable/filterable, not a giant unfiltered table), Statutory Summary (PF/ESI/PT/LWF/TDS totals with challan-readiness status), Audit Trail. Individual payslip detail page: full earnings/deductions breakdown, linked attendance/leave data that produced LOP figures (transparency for employee trust), downloadable PDF.

## 16. Search, filter and sorting requirements

Payroll register searchable/filterable by employee, department, cost centre, exception-status; historical-run browsing by period/legal-entity.

## 17. Bulk-action requirements

Bulk one-time-payment/deduction entry (with mandatory per-batch reason and preview-before-commit, per the pattern established across every other module); bulk payslip re-generation (e.g., after a correction) with clear versioning so employees and auditors can tell a payslip was regenerated, not just silently replaced.

## 18. Import and export requirements

Payroll register export (masking-aware); bank-transfer file export (format-specific per bank integration, Module 23); GL/accounting-journal export (Module 23, addressing the Finance User's chart-of-accounts-mapping pain point from [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 8); statutory-report export in government-prescribed formats where applicable.

## 19. Notification requirements

**In-app/email:** payslip published, tax-declaration reminder/deadline, statutory-filing-deadline approaching (Payroll Administrator), payroll-run status changes (Executive/Administrator), compensation-revision-effective notification (Employee). **Mobile:** payslip-available notification only — actual processing/approval is explicitly **not** a recommended mobile action for this module (Product Principle 10 / [00-existing-system-audit.md](../00-existing-system-audit.md)'s note that high-blast-radius actions shouldn't be made easier to do accidentally from a phone).

## 20. Mobile requirements

Employee: view/download payslip, view tax declaration status — read/light-input only. No processing, locking, or bulk-input capability on mobile, a deliberate design choice given this module's risk profile (see Module 24 for full spec).

## 21. Reporting requirements

Payroll register, payroll variance (cycle-over-cycle and vs.-budget), statutory-deduction summary, cost-centre payroll allocation, salary-revision report, payroll audit trail, multi-entity consolidation, leave-encashment liability (Finance-relevant).

## 22. Audit-log requirements

Every input change, every preview run, every lock/rollback, every statutory-configuration change (rate/rule updates), every bulk one-time-payment entry, every bank-file generation — full before/after, actor, approver, timestamp, per Phase 11. This module's audit trail is the one most likely to be directly examined by a statutory auditor or labour authority, and should be designed with that specific audience in mind, not just generic system logging.

## 23. Integration requirements

Module 4 (Attendance — primary payroll input), Module 5 (Leave — LOP/encashment input), Module 7 (Reimbursements — payroll-routed payouts), Module 1 (compensation/statutory/bank data), Module 23 (banking-partner disbursal integration, accounting/ERP GL export, government statutory-portal filing where feasible — flagged as needing per-partner scoping, not assumed universally available), Module 13 (payslip/compensation-letter document generation), Module 15 (full-and-final settlement trigger).

## 24. Error, empty, and edge cases

**Error states:** missing mandatory statutory data (e.g., PAN) blocking a specific employee's inclusion in a run — should isolate that employee with a clear exception, not block the entire run silently or fail ambiguously. **Empty states:** first payroll run for a brand-new tenant with no prior-cycle data for variance comparison — variance reporting should gracefully degrade (no false "100% variance from zero" alarms) rather than produce a meaningless report. **Edge cases:** an employee who joins and exits within the same payroll cycle (full proration both directions); an employee transferring between legal entities mid-cycle (§8 in [05-organisation-data-model.md](../05-organisation-data-model.md), and the open legal question OQ-9 about continuity of service); a payroll run spanning a statutory-rate change mid-period (e.g., a PT-slab change effective mid-month) — needs an explicit, documented proration/cutover rule, **flagged for qualified payroll-professional input**, not invented here.

## 25. Acceptance criteria

Given a payroll run is locked and disbursed, when any user (including a Payroll Administrator) attempts to directly edit a locked period's data, then the system blocks it unconditionally and the only path to correct an error is the arrears/off-cycle-adjustment mechanism (§7.3) — there is no "just fix it" backdoor, by design.

## 26. Dependencies

Module 1, Module 4, Module 5, Module 7, Module 13, Module 15, Module 17, Module 23 (critical — banking/accounting/statutory-filing integrations are load-bearing for this module's core promise, not optional add-ons).

## 27. Risks

**This is the highest-risk module in the entire product.** Specific risks: (1) statutory-calculation errors — mitigated by the variance-acknowledgement gate (§7.1) and by treating statutory rules as versioned configuration (§10), but fundamentally requires ongoing qualified-professional review, not a one-time build-and-forget; (2) the "rollback" terminology risk (§7.2) — overpromising reversibility after real fund movement is both a UX-honesty issue and a potential legal-liability issue if customers rely on a false expectation; (3) regulatory-change lag (Persona 7's named pain point) — this module needs an operational process (someone monitoring statutory changes), not just a technical one; (4) multi-entity/inter-entity-transfer continuity-of-service treatment (OQ-9) is unresolved and materially affects PF/gratuity correctness.

## 28. Open questions

- OQ-9 (carried from [05-organisation-data-model.md](../05-organisation-data-model.md)): inter-entity-transfer continuity-of-service treatment — **blocking**, needs qualified legal/payroll input before this module's transfer-handling logic can be finalised.
- Exact statutory treatment of backdated/retroactive PF-contribution recalculation (§7.3) — **needs qualified payroll-professional review**, not assumed.
- Should the product attempt direct government-portal statutory filing (a claim several competitors imply but don't clearly substantiate per Phase 2 research), or generate compliant files/challans for the customer's own filing process? Recommend starting with the latter (safer, matches what's independently verifiable in the market) and evaluating direct filing as a later-phase differentiator once the underlying calculation engine has a track record — **flagged for Product/Legal decision**, not decided here.

## 29. Release scope

**MVP:** salary structures, standard monthly payroll run with variance-gated lock, PF/ESI/PT/LWF/TDS/gratuity calculation, payslips, bank-transfer file generation, tax declarations, basic statutory reports, full-and-final settlement, loans/advances.
**Later phase:** multi-entity consolidated payroll reporting, off-cycle/arrears automation refinement, direct statutory-portal filing (pending the decision above), multi-country payroll (explicitly deferred per [03-product-vision.md](../03-product-vision.md) non-goals).
**Out of scope:** this module does not perform initial statutory company registration (PF/ESI/PT registration with authorities) — consistent with what even the most statutory-focused competitor (RazorpayX) explicitly excludes; this remains a CA/consultant-assisted step outside the product, at least for MVP (flagged as a potential later differentiator, not an MVP commitment).
