# Module 20 — Policy and Compliance Management

**Status:** Draft v1 (pending stakeholder review) · **Release:** HR Operations
**Depends on:** Module 1 (Core HR — applicability targeting), Module 13 (Documents — policy repository overlap), Module 17 (Workflow Engine)

---

## 1. Module overview

The policy repository (with versioning, effective dates, applicability, and employee acknowledgement) and the compliance calendar (tasks, owners, evidence, audit-readiness) — the module that makes "did every relevant employee acknowledge the current version of this policy" and "are we on track for every statutory compliance deadline" answerable questions rather than assumptions.

## 2. Problem statement

Phase 2 research found statutory-compliance documentation to be inconsistent even among India-native competitors (market research §6) — a recurring pattern of vendor-asserted compliance without independently verifiable evidence trails. This module is this product's answer at the *process* level (distinct from Module 6's payroll-calculation-level statutory correctness): a defensible, evidence-backed record that policies were current, communicated, and acknowledged, and that compliance obligations were tracked to completion.

## 3. Business objective

Give HR/Compliance a reliable system of record for policy versions and acknowledgement completion, and a proactive compliance calendar that surfaces upcoming deadlines with clear ownership — so that "were we compliant on date X" is answerable from the system, not reconstructed after the fact under audit pressure.

## 4. User personas

Primary: **HR Administrator** (policy/compliance-calendar owner), **Employee** (acknowledge policies). Secondary: **Compliance/Audit User** (evidence retrieval, per [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 12), **Leadership/CXO** (compliance-posture visibility).

## 5. User needs

HR needs to publish a policy update and know, definitively, who has and hasn't acknowledged it — not assume compliance because the policy was "sent." Compliance/Audit User needs to pull evidence for a specific historical date without reconstructing it manually. Employee needs policy documents to be findable and the acknowledgement action to be quick, not a barrier that gets ignored/delayed.

## 6. Primary use cases

Publish/version a policy; target applicability (org-wide, department, location, employment-type-specific); track employee acknowledgement (with mandatory re-reading on version change, where policy requires); administer policy quizzes (for higher-stakes policies, e.g., POSH/anti-harassment); manage the compliance calendar (tasks, owners, deadlines, evidence); track compliance-task completion; generate compliance/audit-readiness reports.

## 7. Detailed workflows

### 7.1 Policy publication and acknowledgement tracking

- **Trigger:** HR Administrator publishes a new policy or a new version of an existing one.
- **Steps:** 1) HR Administrator authors/uploads the policy content, sets applicability (which employee segment this applies to, per [05-organisation-data-model.md](../05-organisation-data-model.md) targeting dimensions — department/location/employment-type/grade), and marks whether acknowledgement is mandatory 2) On publish, the system identifies every currently-in-scope employee and creates an acknowledgement-tracking record for each 3) Employees are notified (Module 18) and acknowledge via ESS (Module 16) — for a *revised* version of a previously-acknowledged policy, the system tracks acknowledgement of the new version distinctly (a stale acknowledgement of an old version does not count as compliance with the new one) 4) Optional: a policy quiz must be passed (configurable minimum score, retries allowed) before acknowledgement is considered complete, for higher-stakes policy categories 5) HR Administrator can view real-time completion status and send reminders (Module 18) to outstanding employees 6) A new employee who joins after publication, but who falls within the policy's applicability, is automatically enrolled for acknowledgement as part of Module 3's onboarding checklist (cross-module trigger) — the "current, in-scope population" is dynamic, not a one-time snapshot at publish time.
- **Failure handling:** An employee who changes org unit/location such that a previously-inapplicable policy now applies to them should be automatically enrolled for acknowledgement at that point, not missed because they weren't in scope at original publish time.
- **Audit events:** `PolicyPublished` (with version), `PolicyAcknowledged` (per employee, per version) — this pairing is the specific evidentiary record an audit would examine.

### 7.2 Compliance calendar and task tracking

- **Trigger:** A statutory/internal compliance obligation with a recurring or one-off deadline (e.g., an annual statutory filing, per Module 6's compliance-deadline needs; a recurring mandatory-training cycle, per Module 10).
- **Steps:** 1) Compliance task configured with owner, deadline, recurrence, and required evidence type 2) System tracks task status and sends escalating reminders as the deadline approaches 3) Owner marks complete with evidence attached (a document, a confirmation reference, or a link to the specific record elsewhere in the product, e.g., Module 6's challan-generation confirmation) 4) HR Administrator/Compliance User can review overall compliance-posture status across all tracked obligations at any time, not just at the moment of an actual audit.
- **Audit events:** `ComplianceTaskCompleted`, with evidence reference retained per Phase 11's retention requirements.

## 8. User stories

**US-1**
As an **HR Administrator**, I want to know exactly which employees haven't acknowledged the current version of a mandatory policy, so that I can follow up with the specific people, not guess at overall compliance.
**Acceptance criteria:** Given a policy is revised to a new version, when the HR Administrator views the acknowledgement-status report, then employees who acknowledged only the prior version are shown as outstanding for the new version — a prior acknowledgement never silently satisfies a new version's requirement.

**US-2**
As a **Compliance/Audit User**, I want to pull evidence that a specific employee acknowledged the anti-harassment policy as of a specific past date, so that I can respond to an audit or legal inquiry without reconstructing the record manually.
**Acceptance criteria:** Given an audit request specifies an employee and a date, when the Compliance/Audit User queries the acknowledgement record, then it returns the exact version acknowledged and the acknowledgement timestamp, unambiguously.

## 9. Functional requirements

Policy repository with categories; policy versioning with effective dates; applicability targeting (per [05-organisation-data-model.md](../05-organisation-data-model.md) dimensions); employee acknowledgement tracking (§7.1) including dynamic enrolment for newly-in-scope employees; mandatory re-reading on version change; policy quizzes for high-stakes categories; compliance calendar with tasks, owners, evidence uploads (§7.2); expiry reminders; compliance reports; audit-readiness reporting (a specific, exportable "here's our compliance posture as of today" view, directly useful for Compliance/Audit User and Leadership); data-retention-policy configuration (working with Phase 11's broader retention framework, but this module is where retention *policy* is authored, even though enforcement may span the whole product); legal-hold considerations (flagging specific records/employees as under legal hold, suspending normal retention/deletion processing for them — see Cross-Module Workflow #25).

## 10. Business rules

A policy acknowledgement is version-specific and non-transferable to a later version (§7.1) — this is the module's central integrity guarantee and should never be relaxed for convenience. Legal-hold flags, once applied, must override normal data-retention/deletion processing for the affected records regardless of what any other module's default retention policy would otherwise do — a hard precedence rule.

## 11. Validation rules

A policy cannot be published without at least a defined applicability scope (even if "org-wide" is a valid, explicit choice) — no ambiguous, unscoped policy publication.

## 12. Permission requirements

Policy authoring/publishing is HR-Administrator tier; acknowledgement is a self-service action available to every in-scope employee; compliance-calendar task ownership can be assigned to any role but task *configuration* (creating new tracked obligations) is HR-Administrator tier; Compliance/Audit User gets broad read-only access to acknowledgement/evidence records specifically (consistent with [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 12's defined scope).

## 13. Approval workflows

Not typically required for routine policy publication, though a tenant may configure a review/approval step before a policy goes live (e.g., legal review before publishing a revised code-of-conduct) via Module 17.

## 14. Statuses and state transitions

**Policy version:** Draft → Under Review → Published → Superseded (by a new version, retained for historical-acknowledgement-record integrity, never deleted). **Acknowledgement record:** Pending → Acknowledged (per version) or Overdue. **Compliance task:** Scheduled → Due Soon → Overdue/Completed.

## 15. Record detail-page requirements

Policy detail page: full version history, applicability scope, real-time acknowledgement-completion status (with a filterable list of outstanding employees, directly supporting US-1). Compliance-calendar detail: task history, evidence trail, owner, recurrence pattern.

## 16. Search, filter and sorting requirements

Policy library searchable/filterable by category, applicability; acknowledgement-status report filterable by department/location/outstanding-vs-complete; compliance calendar filterable by owner/due-date/status.

## 17. Bulk-action requirements

Bulk reminder-send to outstanding-acknowledgement employees; bulk applicability-scope adjustment (e.g., extending a policy to a newly-added location).

## 18. Import and export requirements

Compliance-evidence export for audit response (US-2); policy-content bulk import for initial tenant setup/migration.

## 19. Notification requirements

**In-app/email:** new policy published (acknowledgement required), acknowledgement reminder (escalating), compliance-task deadline approaching (to owner), legal-hold applied/lifted (to relevant System/HR Administrator).

## 20. Mobile requirements

Policy reading and acknowledgement should work well on mobile (a genuinely common way employees will encounter this, especially for time-sensitive rollouts) — compliance-calendar management is desktop-oriented (HR Administrator/Compliance User task).

## 21. Reporting requirements

Policy-acknowledgement-completion rate (org-wide and by segment), compliance-calendar on-time-completion rate, audit-readiness summary (US-2's report, generalised), legal-hold status report.

## 22. Audit-log requirements

Every policy publish/version-change, every acknowledgement, every compliance-task completion with evidence, every legal-hold application/lift — per Phase 11, with this module's retention requirements likely among the longest in the product given its explicit audit-defense purpose.

## 23. Integration requirements

Module 3 (onboarding-triggered policy acknowledgement), Module 13 (policy-document repository/template overlap — flagged as a design decision on whether these are the same underlying document infrastructure or two coordinated ones, not assumed), Module 1 (applicability targeting against current employee org-unit/location/grade data), Module 12 (knowledge-base content overlap, per Module 12 §23).

## 24. Error, empty, and edge cases

**Error states:** a policy with an applicability rule that resolves to zero employees (misconfiguration warning at publish time, not a silent no-op). **Empty states:** a new tenant with no policies loaded yet. **Edge cases:** an employee who moves out of a policy's applicability scope after acknowledging it (should the acknowledgement record persist as historical fact even though it's no longer "currently applicable" to them? Yes — historical acknowledgement facts should never be deleted just because current applicability changed, consistent with this product's general "supersede, don't erase" philosophy); a legal hold applied to an employee whose data would otherwise be due for deletion per Module 15's post-separation retention policy (§10's hard precedence rule directly resolves this).

## 25. Acceptance criteria

Given a legal hold is applied to a specific employee's records, when that employee's normal data-retention deletion date arrives, then the deletion is blocked/skipped for the held records, and this is itself logged as an explicit, auditable event (not merely an absence of deletion that looks the same as a bug).

## 26. Dependencies

Module 1, Module 3, Module 13, Module 17, Module 18.

## 27. Risks

The legal-hold/retention-precedence logic (§10) is exactly the kind of cross-cutting rule that's easy to implement correctly in this module but miss in some other module's own deletion/archival logic (e.g., a bulk-export or data-purge routine elsewhere in the product that doesn't check for a legal hold) — this needs to be enforced as a genuinely central, product-wide gate (Phase 11), not just this module's own internal rule.

## 28. Open questions

Should the policy repository and Module 13's document-template infrastructure be fully unified, or are they deliberately separate systems with a coordination layer? Flagged for architecture decision, not resolved here (§23).

## 29. Release scope

**MVP:** policy repository with versioning/applicability/acknowledgement tracking, compliance calendar with tasks/evidence, basic audit-readiness reporting, legal-hold flagging.
**Later phase:** policy quizzes at scale, AI-assisted compliance-calendar population from regulatory-change monitoring (Module 25), deeper cross-module retention-policy orchestration UI.
**Out of scope:** this module does not itself provide legal advice on what policies/compliance obligations apply to a given tenant — it's a tracking and evidence system, not a compliance-advisory service.
