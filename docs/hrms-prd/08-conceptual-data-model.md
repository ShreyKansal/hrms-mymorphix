# 08 — Conceptual Data Model

**Status:** Draft v1 (pending stakeholder review)
**Last updated:** 2026-07-23
**Depends on:** [05-organisation-data-model.md](05-organisation-data-model.md) (Tenant/Organisation/Legal Entity/Business Unit/Department/Team/Location/Cost Centre/Position/Job/Designation/Grade already fully specified there — not repeated here, only cross-referenced)
**Scope note:** conceptual, not physical/logical schema — column types, indexes-in-detail, and storage engine choice are implementation decisions for a later phase, not this PRD.

---

## How to read this document

For every entity: **Purpose**, **Key attributes**, **Relationships**, **Ownership** (which module is authoritative), **Tenant isolation** (always "yes, hard boundary" per [05-organisation-data-model.md](05-organisation-data-model.md) §10 unless noted), **Sensitive fields**, **Effective-dating**, **Soft-delete**, **Audit**, **Retention**, **Indexing considerations**. Entities already fully specified in [05-organisation-data-model.md](05-organisation-data-model.md) (Tenant, Organisation, Legal Entity, Business Unit, Department, Team, Location, Cost Centre, Position, Job, Designation, Grade) are listed here only for completeness of the full inventory, with a pointer back rather than repeated detail.

---

## Organisation entities (full detail in [05-organisation-data-model.md](05-organisation-data-model.md))

**Tenant, Organisation, Legal Entity, Business Unit, Department, Team, Location (Branch/Work Location), Cost Centre, Position, Job, Designation, Grade** — see [05-organisation-data-model.md](05-organisation-data-model.md) §3–§4. All are tenant-isolated by definition (Tenant is the isolation boundary itself); all except Team/Position are soft-delete-only; Grade/Cost-Centre/Department carry compensation/budget-adjacent sensitivity worth field-level scoping (Module 21) even though the entities themselves aren't "sensitive" in the way an individual's personal data is.

## Employee-domain entities

**Employee** — Purpose: identity/biographical system of record (Module 1). Key attributes: legal name, DOB, gender, government IDs, contact info. Relationships: 1:many Employment Assignment (effective-dated history, [05](05-organisation-data-model.md) §7), 1:many Compensation, 1:1 current Employment Assignment (derived). Ownership: Module 1. Sensitive fields: government IDs (masked per Module 1 §12), DOB. Effective-dating: some fields (legal name changes) warrant field-history tracking, not full Employment-Assignment-style effective-dating. Soft-delete: yes — never hard-deleted, transitions to Separated/Alumni status instead (Module 15 §10). Audit: full, per Phase 11. Retention: per Module 20 §9's retention-policy framework, subject to legal-hold override (Cross-Module Workflow #25). Indexing: government-ID uniqueness index (tenant-scoped), name/email search index.

**Employment Assignment** — Purpose: effective-dated record of department/manager/location/grade/designation/payroll-group/etc. per [05](05-organisation-data-model.md) §7 — the core historical-truth entity of the whole product. Key attributes: effective_from, effective_to, reason_code, all assignment attributes, approval_reference. Relationships: many:1 Employee, many:1 each of Department/Location/Grade/etc. Ownership: Module 1. Effective-dating: this entity **is** the effective-dating mechanism — see [05](05-organisation-data-model.md) §7. Soft-delete: records are never deleted, only superseded (new record created, old record's effective_to set). Audit: every creation is itself an audit-relevant event. Retention: indefinite (core historical record). Indexing: (employee_id, effective_from) composite index for "state as of date X" queries — this is the single most performance-critical query pattern in the whole data model (Phase 12 NFR).

**Compensation** — Purpose: effective-dated pay record, deliberately separate from Employment Assignment ([05](05-organisation-data-model.md) §8). Key attributes: effective_from, CTC/component breakdown, reason_code. Relationships: many:1 Employee. Sensitive: yes, highest-tier (Module 1 §12/Module 6 §12). Effective-dating: yes, same pattern as Employment Assignment. Retention: indefinite, statutory-relevant (Module 6).

**Bank Account** — Purpose: payroll-disbursal destination. Key attributes: account number (masked), IFSC, account holder name. Relationships: many:1 Employee (an employee may have exactly one active payroll bank account, with history retained per Module 1 §8's fraud-prevention audit requirement). Sensitive: highest tier. Effective-dating: field-history (not full Employment-Assignment pattern) with mandatory change-notification (Module 1 §8 US-3). Audit: every change logged with old/new masked values, actor, IP.

**Tax Profile** — Purpose: PAN, tax regime election, declarations (Module 6). Key attributes: PAN, regime choice, declared investments, proof-submission status. Sensitive: highest tier. Effective-dating: per tax year (Module 22's tax-year calendar concept).

**Emergency Contact, Dependant, Nominee** — Purpose: Module 1's personal-data field groups. Relationships: many:1 Employee. Sensitive: personal data of non-employees (a specific privacy consideration — these individuals haven't consented as system users, Phase 11 relevance). Soft-delete: yes.

**Document** — Purpose: generated letters and uploaded documents (Module 13). Key attributes: category, template_version (if generated), file reference, signature/acknowledgement status, expiry_date. Relationships: many:1 Employee, many:1 Document Template (if generated). Sensitive: category-dependent (Module 13 §10's warning-letter narrower-visibility rule). Retention: per Module 20, with generated-document immutability (Module 13 §25 — a document is a point-in-time snapshot, never live-re-rendered).

**Asset** — Purpose: inventory item (Module 14). Key attributes: serial number, category, condition, current_holder (nullable). Relationships: many:1 current Employee (nullable, unassigned assets exist), 1:many Assignment History. Effective-dating: assignment history is its own append-only log, same philosophy as Employment Assignment but lighter-weight.

## Attendance and leave entities

**Shift** — Purpose: shift-pattern definition (Module 4 §9, [05](05-organisation-data-model.md) §3's Shift Group). Key attributes: start/end time, pattern type (fixed/flexible/rotational/split/overnight).

**Attendance Record** — Purpose: per-day computed attendance status per employee (Module 4). Key attributes: date, status, computed hours, exception_flag. Relationships: many:1 Employee, 1:many raw Punch records. Effective-dating: not applicable in the Employment-Assignment sense, but immutable-raw-punch + superseding-regularised-value follows the same "never erase, only supersede" philosophy (Module 4 §7.2). Indexing: (employee_id, date) composite — extremely high query volume, direct Phase 12 NFR concern given thousands-of-employees × daily-records scale (Module 4 §16).

**Attendance Request** — Purpose: regularisation/WFH/on-duty request (Module 4 §7.2). Key attributes: type, requested date/time, status, approval chain reference. Relationships: many:1 Employee, many:1 Attendance Record (the record it corrects), 1:1 Workflow Instance.

**Leave Policy** — Purpose: leave-type/accrual/carry-forward/encashment rule set (Module 5 §9, [05](05-organisation-data-model.md) §3's Leave Policy Group). Key attributes: leave_type, accrual_rule, carry_forward_cap, encashment_rule.

**Leave Balance** — Purpose: per-employee, per-leave-type current and historical balance (Module 5). Key attributes: leave_type, current_balance, as_of_date. Relationships: many:1 Employee, many:1 Leave Policy. Effective-dating: balance snapshots at year-end closure (Module 5 §7.3) are retained historically, not overwritten.

**Leave Request** — Purpose: application record (Module 5 §14's state machine). Key attributes: type, date range, status, balance-impact snapshot. Relationships: many:1 Employee, 1:1 Workflow Instance.

## Payroll entities

**Payroll Group** — Purpose: pay-schedule/statutory-ruleset grouping ([05](05-organisation-data-model.md) §3, Module 6 §9).

**Pay Component** — Purpose: individual earning/deduction/reimbursement/benefit definition with statutory treatment (Module 6 §11's "every component must map to a defined statutory treatment" rule). Key attributes: name, type, taxability, PF-wages-inclusion flag.

**Salary Structure** — Purpose: the specific set of Pay Components and amounts/formulas applicable to an employee (Module 6 §9). Relationships: many:1 Employee (via Compensation), many:many Pay Component.

**Payroll Run** — Purpose: one processing cycle instance (Module 6 §14's state machine — Draft through Disbursed/Rolled Back). Key attributes: period, status, totals. Relationships: 1:many Payroll Input, 1:many Payslip. Audit: the single most audit-critical entity in the data model (Module 6 §22).

**Payroll Input** — Purpose: per-employee, per-run input line (attendance-derived LOP, leave encashment, reimbursement, one-time payment, etc.) (Module 6 §7.1). Relationships: many:1 Payroll Run, many:1 Employee, sourced from Module 4/5/7.

**Payslip** — Purpose: finalised, immutable per-employee output of a locked Payroll Run (Module 6 §15). Relationships: many:1 Payroll Run, many:1 Employee. Retention: indefinite, statutory.

**Reimbursement Claim** — Purpose: expense claim record (Module 7 §14's state machine). Key attributes: category, amount, receipt reference, OCR-extracted vs. confirmed values, status.

## Recruitment entities

**Candidate** — Purpose: applicant profile (Module 8). Relationships: many:many Job Requisition (via Application), optionally linked to a historical Employee record (rehire case, Cross-Module Workflow #17). Sensitive: PII with defined retention limits for rejected/withdrawn candidates (Module 8 §10).

**Job Requisition** — Purpose: approved headcount/role opening (Module 8 §7.1, optionally linked to Module 2's Position). Key attributes: role, grade, budget reference, approval status.

**Application** — Purpose: the join entity between Candidate and Job Requisition, carrying pipeline-stage state (Module 8 §14).

**Interview** — Purpose: scheduled interview instance with panel and scorecard(s) (Module 8 §9). Relationships: many:1 Application, many:many Employee (panel members).

**Offer** — Purpose: compensation offer with approval/acceptance state (Module 8 §14). Relationships: many:1 Application. Sensitive: compensation data.

## Performance and learning entities

**Goal** — Purpose: individual/team/org goal with cascading relationships (Module 9 §9). Relationships: many:1 Employee, many:1 parent Goal (self-referential, for cascading).

**Review Cycle** — Purpose: the configured cycle definition (Module 9 §14). **Performance Review** — Purpose: the per-employee, per-cycle instance (self/manager/peer/360 components, ratings). Relationships: many:1 Employee, many:1 Review Cycle. Sensitive: ratings, feedback content.

**Course** — Purpose: catalogue entry (Module 10 §9). **Training Enrolment** — Purpose: per-employee assignment/completion record (Module 10 §14). Relationships: many:1 Employee, many:1 Course. Retention: long, given compliance-evidence purpose (Module 10 §22).

## Engagement, service, and governance entities

**Survey** — Purpose: pulse survey/eNPS definition and results (Module 11 §14). Key attributes: questions, anonymity_level, minimum_respondent_threshold. **Important:** individual response records must **not** be linkable back to a respondent when anonymity is promised — this is a structural, not just permission-based, constraint (Module 11 §7.1/§25).

**Helpdesk Ticket** — Purpose: HR service request (Module 12 §14). Relationships: many:1 Employee (requester), many:1 Employee (assignee), many:1 Category.

**Policy** — Purpose: versioned policy document with applicability rules (Module 20 §9). Relationships: 1:many Policy Version, many:many applicable Employee (derived from applicability rules, not a static list). **Policy Acknowledgement** — Purpose: per-employee, per-version acknowledgement record (Module 20 §7.1's version-specificity rule — never transferable to a later version).

**Workflow (Definition and Instance)** — Purpose: Module 17's configurable approval-chain definitions and their runtime instances. Key attributes (Definition): trigger, conditions, chain type, version. Key attributes (Instance): current step, decisions-so-far, status. Relationships: Instance many:1 Definition (a specific version, per Module 17 §7.2's in-flight-version-isolation rule), Instance polymorphically relates to whatever record triggered it (a Leave Request, a Requisition, etc.).

**Approval** — Purpose: an individual decision within a Workflow Instance (approve/reject/return, by whom, when, with what comment) — could be modelled as a sub-entity of Workflow Instance rather than fully standalone, an implementation detail flagged for the eventual logical schema, not resolved here.

**Notification** — Purpose: Module 18's dispatched-notification record (§14). Key attributes: channel, priority, delivery_status, source_event_reference.

## POSH and Benefits entities (added 2026-07-23, per [16-product-decision-log.md](16-product-decision-log.md) D-014)

**IC Composition** — Purpose: tracks Internal Committee member eligibility and validity (Module 26 §7.2). Key attributes: role (Presiding Officer/Internal/External), eligibility status, term dates. Relationships: many:many Employee (or, for external members, a non-Employee reference — an open modelling question per Module 26 §24, since this product's data model is otherwise Employee-centric). **Access: this is the one entity in the entire model exempt from the general permission-scoping approach — see Module 26 §12's hard exception.**

**POSH Case** — Purpose: confidential case record (Module 26 §14's state machine). Key attributes: status, filing date, statutory deadline. Relationships: many:1 IC Composition (the constituted committee for that case), references to Complainant/Respondent Employee records held at the strictest confidentiality tier in the product — **structurally inaccessible outside the case's own IC scope, per Module 26 §10; this is not a masking rule like other sensitive entities, it is a hard access boundary with no configuration override.** Retention: per Module 26, subject to the same legal-hold framework (Module 20 §10) but with access restrictions that survive even for Compliance/Audit User's normally-broad read access (a deliberate, named exception to that persona's usual scope).

**Benefits Plan** — Purpose: plan definition (Module 27 §9). Key attributes: type, coverage tiers, cost-sharing structure, eligibility rule reference (reusing [05-organisation-data-model.md](05-organisation-data-model.md)'s existing dimensions, not a new targeting concept). **Benefits Election** — Purpose: per-employee, effective-dated coverage record (Module 27 §14). Relationships: many:1 Employee, many:1 Benefits Plan, many:many Dependant (reusing the existing Dependant entity, with a coverage-election attribute layered on, per Module 27 §9's explicit non-duplication decision).

## Access and platform entities

**Role** — Purpose: Module 21's named capability set (system or custom). **Permission** — Purpose: the individual module/action/field/record-scope grant, composed into Roles. Relationships: many:many Role↔Permission, many:many User(Employee)↔Role (with scope and, for temporary grants, an expiry date attached to the assignment itself, not the Role definition — per Module 21 §7.1).

**Audit Event** — Purpose: the immutable record every module writes to per Phase 11's schema (actor, timestamp, tenant, action, entity, before/after, reason, approval_reference, correlation_id). Relationships: polymorphic — relates to whatever entity/action it records. Retention: the longest of any entity type in the system by design, subject to Module 20's legal-hold override (never itself subject to normal deletion, since the audit trail's integrity is the point).

**Integration** — Purpose: Module 23's configured connection to an external system (§14's state machine). Key attributes: type, configuration/field-mapping, credentials (encrypted, never in plaintext — Phase 11), health_status.

**Webhook** — Purpose: outbound event-delivery configuration for custom/third-party integrations (Module 22/23). Relationships: many:1 Integration (or standalone for a pure custom webhook not tied to a named integration partner).

**Report Definition** — Purpose: Module 19's saved custom report/dashboard configuration. Key attributes: base domain(s), fields, filters, sharing scope. Relationships: many:1 Employee (creator/owner), many:many Employee (shared-with, where applicable).

---

## Cross-cutting data-model principles (restating, for this document's own completeness, the principles established across [05](05-organisation-data-model.md) and the module PRDs)

1. **Effective-dating is the default assumption for anything organisationally or financially significant** — Employment Assignment, Compensation, Leave Policy assignment, Salary Structure, Payroll Group assignment. Entities *without* effective-dating (Helpdesk Ticket, Survey, Notification) are the exception, and it's the exception that should be justified, not the rule.
2. **Soft-delete/supersede, never hard-delete, for anything with audit or historical-truth relevance** — the sole exception is the data-deletion/anonymisation workflow (Cross-Module Workflow #25), which is itself a deliberate, legally-gated, audited exception, not evidence against the general rule.
3. **Tenant isolation is absolute and structural** for every entity above, with no per-entity exception ([05](05-organisation-data-model.md) §10) — this should be enforced at the data-access layer (e.g., row-level security or equivalent), not solely at the application-logic layer, per Phase 11's technical-mechanism specification.
4. **Sensitive-field masking is field-level, not just record-level** — Module 1 §12's compensation/bank/statutory-ID pattern is the template every other module's sensitive fields (performance ratings, HR case notes, survey free-text) should follow.
5. **High-write-volume entities (Attendance Record above all) need indexing/partitioning strategy attention from day one** — this is flagged here as a data-model-level concern feeding directly into [11-non-functional-requirements.md](11-non-functional-requirements.md), not an afterthought to be discovered under production load.

## Open questions

- OQ-26: Should Approval be a first-class standalone entity or a sub-structure of Workflow Instance? An implementation-level logical-schema decision, flagged but not resolved at this conceptual-model level.
- OQ-27: Exact data-residency metadata requirements for future multi-country Legal Entities (per [05](05-organisation-data-model.md) §10) — deferred to whenever multi-country expansion is actually scoped, per [03-product-vision.md](03-product-vision.md)'s MVP boundaries, but the Legal Entity entity should reserve a field for it now rather than requiring a schema migration later.
