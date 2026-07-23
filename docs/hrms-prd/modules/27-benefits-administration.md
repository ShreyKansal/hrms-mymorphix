# Module 27 — Benefits Administration

**Status:** Draft v1 (pending stakeholder review) · **Release:** Talent (core) / Enterprise (advanced plan design and benchmarking)
**Depends on:** Module 1 (Core HR — dependant/nominee data), Module 6 (Payroll — premium deductions and employer-contribution cost), Module 23 (Integrations — insurance/benefits-platform providers), Module 17 (Workflow Engine)
**Added:** 2026-07-23, following a gap-check against actual competitor feature coverage (see [16-product-decision-log.md](../16-product-decision-log.md) D-014) — Zoho People, BambooHR (paid tier), and Keka all ship this as a distinct module; the original 25-module brief only referenced "benefits" in passing (flexible benefit plans under Payroll, insurance/benefits platforms as an integration category) without an owning module for the actual enrollment/plan-administration workflow.

---

## 1. Module overview

Benefits plan definition (health insurance, life insurance, and other employer-provided benefits), eligibility rules, enrollment (including open-enrollment windows and life-event-triggered changes), dependant management for coverage purposes, and the payroll-deduction/employer-cost handoff to Module 6. This is distinct from Module 6's "flexible benefit plans" (which is about structuring *taxable/non-taxable salary components*, a compensation-structuring concept) — this module is about the actual *insurance/welfare plan enrollment and administration* lifecycle.

## 2. Problem statement

Competitor research found Benefits Administration to be a real, separately-monetised module (BambooHR sells it as a distinct add-on) rather than something naturally absorbed into core payroll or HR — treating it as a footnote under Payroll (as the original 25-module scope did) risks under-specifying a genuinely distinct workflow: plan selection during open enrollment, dependant coverage elections, life-event-triggered mid-year changes (marriage, birth of a child, etc.), and the resulting payroll-deduction and employer-cost implications, none of which map cleanly onto Module 6's salary-structure concepts.

## 3. Business objective

Give employees a clear, low-friction way to understand and elect their benefits coverage (including dependants), give HR Administrator a manageable way to define and administer plans and eligibility rules, and ensure the resulting payroll deductions and employer costs flow correctly and traceably into Module 6 without manual reconciliation — directly consistent with this PRD's core "unified data model, not manual reconciliation" differentiation claim, applied here to a module the original scope under-specified.

## 4. User personas

Primary: **Employee** (elect coverage, manage dependants). Secondary: **HR Administrator** (plan definition, eligibility-rule configuration, open-enrollment management), **Finance User** (employer-cost visibility, per [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 8), **Payroll Executive/Administrator** (deduction processing, Module 6 handoff).

## 5. User needs

Employee needs to understand what they're eligible for and make an informed, time-bounded choice (open enrollment) or a life-event-triggered change without confusion about deadlines or what's changed. HR Administrator needs to define plans and eligibility once (by grade, employment type, tenure, per [05-organisation-data-model.md](../05-organisation-data-model.md)'s existing applicability dimensions, reused here rather than reinvented) and have enrollment enforce those rules automatically. Payroll Executive needs enrollment elections to arrive as clean, unambiguous payroll input, the same "no ambiguity at handoff" discipline already established for Attendance/Leave's handoff to Payroll (Module 4/5, Cross-Module Workflows #10/#11).

## 6. Primary use cases

Define a benefits plan (type, coverage tiers, cost-sharing between employer/employee, eligibility rules); run an open-enrollment cycle; process a life-event-triggered enrollment change; manage covered dependants (reusing Module 1's Dependant entity, not duplicating it); view current elections and coverage; process the payroll-deduction handoff; generate benefits-utilisation and cost reports.

## 7. Detailed workflows

### 7.1 Open enrollment cycle

- **Trigger:** Configured annual (or otherwise periodic) open-enrollment window opens (Module 22's calendar-configuration concept, applied here).
- **Preconditions:** Benefits plans and eligibility rules are configured.
- **Actor:** Employee (elects), HR Administrator (configures and monitors).
- **Steps:** 1) System identifies every employee eligible for at least one plan (per eligibility rules referencing Grade/Employment-Type/Location/tenure, [05-organisation-data-model.md](../05-organisation-data-model.md)) and surfaces their available plan options through Module 16's Employee Home 2) Employee reviews options (coverage tiers, cost-sharing, what dependants can be added), makes elections, and adds/updates covered dependants (reusing, not duplicating, the Module 1 Dependant entity — a dependant added here for benefits-coverage purposes is the same record Module 1 already models, with a coverage-election attribute layered on top) 3) Employee submits before the window closes; a clear, escalating reminder sequence runs as the deadline approaches (Module 18) 4) Employees who take no action are handled per a configured default policy (carry forward prior elections, or default to no coverage — **tenant-configurable, no single asserted default**, since this is a genuine policy choice with real financial consequences for the employee, not a technical detail to assume) 5) On window close, finalised elections become the new effective-dated coverage record, and the resulting payroll-deduction change is queued for the next payroll cycle (§7.3).
- **Decision points:** An employee attempting to elect a dependant or coverage tier they're not eligible for is blocked with a clear explanation, not a silent rejection.
- **Failure handling:** A payroll-deduction change resulting from open enrollment that would land in an already-locked payroll period follows the same correction/next-cycle handling already established in Module 6 §7.1 — no new mechanism invented here, this module simply feeds into the existing one.
- **Audit events:** `OpenEnrollmentOpened`, `BenefitsElectionSubmitted`, `OpenEnrollmentClosed`.

### 7.2 Life-event-triggered enrollment change

- **Trigger:** A qualifying life event (marriage, birth/adoption of a child, spouse's employment-status change, etc.) occurring outside the open-enrollment window.
- **Preconditions:** The event type is configured as eligible for an off-cycle election change, and the request falls within a configured window after the event (e.g., 30 days — a real, common insurance-industry constraint, **flagged for confirmation against the tenant's actual insurance-provider terms rather than asserted as a universal number by this PRD**).
- **Steps:** 1) Employee reports the life event and requests the specific coverage change (e.g., adding a newborn dependant) 2) HR Administrator (or an automated eligibility check, where the event type and requested change are unambiguous) verifies the change is within the qualifying window and scope 3) On approval, the coverage record updates effective from the event date (not the request-processing date, an important distinction given insurance continuity), and the payroll-deduction adjustment is queued, potentially with retroactive proration if there's a gap between the event date and processing date — following the same arrears-style handling already established in Module 6 §7.3, not a new mechanism.
- **Approval logic:** HR Administrator verification for anything not unambiguously auto-approvable (Module 17).
- **Audit events:** `LifeEventEnrollmentChangeProcessed`.

### 7.3 Payroll-deduction handoff

- **Trigger:** A finalised enrollment change (§7.1 or §7.2).
- **Preconditions:** Coverage election is finalised, not mid-process.
- **Steps:** Same pattern as Cross-Module Workflows #10–#12 (Leave/Attendance/Reimbursement feeding Payroll): this module hands off a clean, unambiguous, effective-dated deduction amount (and, separately, the employer-cost figure for Finance's visibility, per Module 1 §8's Finance User needs) to Module 6 §7.1 as payroll input, with the correct statutory/taxability treatment applied per whatever component-definition rules Module 6 §9 already establishes for this benefit type — no new statutory-treatment mechanism invented here.
- **Audit events:** `PayrollInputChanged` (source = Benefits).

## 8. User stories

**US-1**
As an **Employee**, I want to see clearly what I'm eligible for, what it costs me each pay cycle, and who I can cover, before I make my open-enrollment election, so that I make an informed choice rather than guessing.
**Acceptance criteria:** Given an employee opens their open-enrollment elections, when they view a plan option, then the per-cycle cost to them, the employer's contribution, and the eligible-dependant rules are all shown together, not scattered across separate screens requiring the employee to piece the decision together themselves.

**US-2**
As an **HR Administrator**, I want to define plan eligibility using the same Grade/Employment-Type/Location rules I already use elsewhere in the product, so that I don't have to learn a second, benefits-specific eligibility-configuration system.
**Acceptance criteria:** Given an eligibility rule references Employment Type = "Permanent" (an existing [05-organisation-data-model.md](../05-organisation-data-model.md) concept), when a contractor's Worker Type is evaluated against it, then they are correctly excluded without any benefits-specific new configuration concept being required.

**US-3**
As a **Payroll Executive**, I want benefits-deduction changes to arrive as clean payroll input with no ambiguity, the same way Leave and Attendance do, so that benefits doesn't become the one exception requiring manual reconciliation.
**Acceptance criteria:** Given an open-enrollment cycle closes, when the next payroll run collects inputs (Module 6 §7.1), then every affected employee's new deduction amount is present and unambiguous, with no manual lookup required — directly extending the "no ambiguity at handoff" acceptance criterion already established for Modules 4/5's payroll handoff.

## 9. Functional requirements

Benefits plan definition (type, coverage tiers, cost-sharing structure, effective dates); eligibility rules reusing [05-organisation-data-model.md](../05-organisation-data-model.md)'s existing dimensions (Grade, Employment Type, Location, tenure) rather than inventing new ones; open-enrollment cycle management (§7.1); life-event-triggered change processing (§7.2); dependant management reusing Module 1's Dependant entity with a coverage-election attribute; payroll-deduction and employer-cost handoff (§7.3); benefits-utilisation and cost reporting; plan-document repository (reusing Module 13's document infrastructure for plan summaries/certificates, not a separate document system).

## 10. Business rules

Eligibility rules are defined using the same applicability dimensions the rest of the product already uses ([05-organisation-data-model.md](../05-organisation-data-model.md)) — this module introduces no new targeting/applicability concept, a deliberate consistency decision (mirroring Module 20 §9's policy-applicability targeting, which follows the same principle). Coverage changes are always effective-dated from the correct business date (event date or enrollment-window-close date), never the administrative processing date, given insurance-continuity implications.

## 11. Validation rules

An employee cannot elect a plan or coverage tier they're not eligible for (§7.1's block); a life-event change request outside the configured qualifying window is blocked with a clear explanation, directing the employee to wait for the next open-enrollment cycle instead.

## 12. Permission requirements

Employees see only their own elections and eligible options; HR Administrator configures plans/eligibility and sees aggregate enrollment data; Finance User sees aggregate employer-cost data (not necessarily individual elections) per the same default-restriction pattern already established for compensation data in Module 1 §12/Module 6 §12; Payroll Executive/Administrator sees the deduction data needed for processing.

## 13. Approval workflows

Life-event change verification (§7.2, Module 17); plan-definition changes affecting many employees at once may warrant HR Administrator + Finance co-sign given cost implications (tenant-configurable, per the same pattern established for other cost-impacting configuration changes across this PRD).

## 14. Statuses and state transitions

**Open Enrollment Cycle:** Scheduled → Open → Closed → Finalised. **Individual Election:** Draft → Submitted → Finalised (or, for life-event changes) → Under Review → Approved/Rejected → Finalised.

## 15. Record detail-page requirements

Employee's benefits page (within Module 16's Employee Home): current elections, coverage tiers, covered dependants, cost-per-cycle, plan documents. HR Administrator's plan-management page: plan definitions, eligibility rules, enrollment-cycle status, aggregate utilisation.

## 16. Search, filter and sorting requirements

Enrollment-status dashboard filterable by department/plan/completion-status (for HR Administrator tracking open-enrollment completion, similar in spirit to Module 20 §8 US-1's acknowledgement-completion tracking).

## 17. Bulk-action requirements

Bulk reminder-send to employees who haven't completed open enrollment as the deadline approaches.

## 18. Import and export requirements

Enrollment-data export for insurance-provider submission (Module 23 integration point); historical benefits-election import for migration from a prior system.

## 19. Notification requirements

**In-app/email:** open-enrollment window open/closing-soon (escalating), election confirmed, life-event-change status, plan-document updates.

## 20. Mobile requirements

Viewing current elections and coverage should work well on mobile; the open-enrollment decision-making flow itself is reasonably well-suited to mobile too given it's a periodic, not high-frequency, action, unlike the deliberately-mobile-first Modules 4/5.

## 21. Reporting requirements

Enrollment-completion rate (by department, for HR Administrator's open-enrollment-cycle management), benefits-cost report (employer contribution by plan/department, for Finance), utilisation trends.

## 22. Audit-log requirements

Every plan-definition change, every enrollment election and life-event change, every payroll-deduction handoff — per [10-security-privacy-audit.md](../10-security-privacy-audit.md) §13, at the same rigor as any other payroll-input-producing module.

## 23. Integration requirements

Module 23 (insurance/benefits-platform providers — this module's most commercially load-bearing external dependency, per that module's own integration-framework requirements), Module 6 (payroll-deduction handoff), Module 1 (Dependant entity reuse), Module 13 (plan-document repository reuse).

## 24. Error, empty, and edge cases

**Error states:** an insurance-provider integration failure during enrollment submission (should not silently lose an employee's election — needs the same manual-resync/recovery capability established as a general Module 23 principle). **Empty states:** a new tenant with no benefits plans configured yet — this module should be entirely absent/inactive for such a tenant (progressive disclosure, per [05-organisation-data-model.md](../05-organisation-data-model.md) §2's principle applied here) rather than presenting a confusing "no benefits available" state to every employee. **Edge cases:** an employee who becomes eligible for a plan mid-year (e.g., a promotion crossing a grade-based eligibility threshold, Module 1 §7.2) — should trigger an off-cycle enrollment opportunity, not require waiting for the next open-enrollment window, since the eligibility change itself is the qualifying event; a dependant who ages out of eligibility (e.g., a child reaching a maximum-coverage age) — needs a proactive, not reactive, notification before coverage silently lapses.

## 25. Acceptance criteria

Given an employee's Employment Assignment changes such that their benefits eligibility changes (e.g., a promotion crossing a grade threshold), when the change is processed (Module 1 §7.2), then this module is notified and surfaces the resulting new-or-changed eligibility to the employee as an off-cycle enrollment opportunity, without requiring a manual cross-check between HR and Benefits administration.

## 26. Dependencies

Module 1, Module 6, Module 13, Module 17, Module 18, Module 22 (enrollment-cycle calendar configuration), Module 23 (insurance-provider integration).

## 27. Risks

Insurance-provider integration reliability (Module 23 §27's general vendor-dependency risk, applied here) directly affects whether employees' actual coverage matches what this module records — a mismatch here has real financial/welfare consequences for employees, not just a data-quality inconvenience, warranting the same seriousness as Module 6's own integration dependencies.

## 28. Open questions

- Exact default life-event qualifying-window length (§7.2) — flagged as needing confirmation against actual insurance-provider terms rather than a number this PRD asserts universally.
- Should this module's scope extend to non-insurance benefits (meal vouchers, wellness stipends, etc.) commonly bundled under "benefits" by some competitors, or stay narrowly insurance-focused for MVP? Recommend starting narrow (health/life insurance) and expanding based on validated customer demand, consistent with this PRD's general "don't speculatively build breadth" principle (e.g., [23-integrations.md](23-integrations.md) §29's equivalent scoping decision) — flagged for Product stakeholder confirmation.

## 29. Release scope

**MVP:** plan definition and eligibility rules (reusing existing applicability dimensions), open enrollment, dependant coverage management, payroll-deduction handoff.
**Later phase:** life-event-triggered off-cycle changes (§7.2) if not feasible for initial MVP given the additional verification-workflow complexity, benefits-cost benchmarking/plan-comparison tooling, non-insurance benefit types (§28).
**Out of scope:** this module does not become an insurance brokerage or plan-design consultancy — it administers plans the tenant has already sourced through their own insurance provider/broker relationship, consistent with this PRD's general pattern of integrating with, not replacing, specialised external providers (Module 23).
