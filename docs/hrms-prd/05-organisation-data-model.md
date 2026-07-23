# 05 — Organisation and Data Hierarchy

**Status:** Draft v1 (pending stakeholder review)
**Last updated:** 2026-07-23
**Depends on:** [04-personas-and-roles.md](04-personas-and-roles.md)
**Feeds into:** [08-conceptual-data-model.md](08-conceptual-data-model.md), Module 2 (Organisation Management), Module 21 (Roles and Permissions), all module PRDs

---

## 1. Design principle: effective-dating is the backbone, not an add-on

The single most consequential architectural decision in this document: **every organisationally-significant relationship in this model is effective-dated** (has a validity start date and, optionally, an end date), not just current-state fields that get silently overwritten. This is not a nice-to-have — it is required to answer questions every persona in Module 04 needs answered: "who was this employee's manager on 15 March last year," "what was the department's headcount at the end of the last fiscal year," "what grade was this employee at when this compensation decision was made." Competitor research (Phase 2) repeatedly surfaced pain points that trace back to weak historical-state handling (e.g., disconnects between HR and Payroll systems' view of "who reports to whom" at a point in time). Getting this right from day one avoids a costly re-architecture later — retrofitting effective-dating onto a current-state-only schema is one of the most expensive mistakes an HRMS can make.

**Confirmed requirement, not an assumption:** the brief explicitly lists "effective-dated changes," "historical hierarchy preservation," and traceable "employee transfer/promotion/manager-change handling" as required capabilities — this section operationalises those requirements into a concrete model.

---

## 2. Entity hierarchy overview

```
Tenant
 └─ Organisation (1 per tenant, typically — see §3 for multi-org tenants)
     └─ Legal Entity (1..n)
         └─ Business Unit (0..n, optional)
             └─ Department (1..n)
                 └─ Sub-Department (0..n, optional)
                     └─ Team (0..n, optional)

Location hierarchy (cross-cuts the above — an org unit doesn't "belong" to a location, employees and positions do):
 Country → Region/State → Branch/Office Location → Work Location (desk/floor, or "remote")

Reporting hierarchy (independent of org-unit hierarchy — see §5):
 Employee → Functional Manager (1, primary)
          → Dotted-line Manager (0..n, secondary)
          → HR Business Partner (assigned, not a reporting line)

Position/Job hierarchy:
 Job Family → Job Title → Designation → Grade/Band/Level (see §6)

Policy grouping (assigned to employees, not nested in org structure):
 Payroll Group, Shift Group, Holiday Calendar, Leave Policy Group, Attendance Policy Group
```

**Key modelling decision:** organisational structure (legal entity → department → team), reporting-line structure (who approves whose leave), location, and policy-group assignment are **four separate, independently-assignable dimensions**, not one rigid tree. An employee's department and their manager are related but not the same thing (a matrixed org can have a department that isn't the reporting chain). Modelling them as one tree is a common HRMS design mistake that later blocks matrix-management support (explicitly required — "multiple reporting lines," "dotted-line manager") — see §5.

---

## 3. Entity definitions, mandatory/optional, and cardinality

| Entity | Mandatory? | Cardinality | Notes |
|---|---|---|---|
| **Tenant** | Mandatory | 1 tenant = 1 isolated customer instance | Root of all data isolation (Phase 11). Every other entity in this model is tenant-scoped, with no exceptions. |
| **Organisation** | Mandatory | Typically 1 per tenant | Modelled as a distinct entity from Tenant (not collapsed into it) to support the edge case of a holding-company tenant with genuinely separate sub-organisations that still share a billing/tenant relationship — flagged as **Open Question OQ-8**: is multi-organisation-per-tenant an MVP requirement, or later-phase? Recommend later-phase given added complexity; MVP assumes 1:1 tenant:organisation but the schema should not hard-block a future 1:many. |
| **Legal Entity** | Mandatory (≥1) | 1..n per Organisation | The unit of statutory/payroll compliance (a legal entity has its own PAN/TAN/GSTIN/PF-ESI registration in India). Every employee belongs to exactly one legal entity at a time (effective-dated — can change via inter-entity transfer, see §8). This is the anchor for Module 6 (Payroll)'s "multi-entity payroll" and Module 22's tenant/entity setup. |
| **Business Unit** | Optional | 0..n per Legal Entity | For customers who segment by product line/division rather than (or in addition to) department. Not every customer needs this layer — small/mid customers should be able to skip it entirely (progressive disclosure in Module 2's setup flow, not a forced empty layer). |
| **Department** | Mandatory (≥1) | 1..n per Legal Entity (or Business Unit, if used) | The primary organisational grouping for reporting/analytics. Every employee has exactly one current department (effective-dated). |
| **Sub-Department** | Optional | 0..n per Department | For large departments needing further subdivision (e.g., Engineering → Platform, Product, Infra). |
| **Team** | Optional | 0..n per Department/Sub-Department | The most granular, often informal grouping — closer to "who sits in the same standup" than a compliance-relevant unit. Team membership can be more fluid/less effective-dating-rigorous than Department, since it's lower-stakes. |
| **Cost Centre** | Optional (but strongly recommended for mid-market+) | 0..n, assigned at Department, Position, or Employee level depending on org design | Financial-allocation dimension, often **not the same tree as Department** (a common real-world mismatch between HR's department view and Finance's chart-of-accounts — flagged in Module 08 Finance User persona pain points). Should be modelled as its own assignable attribute, not derived from department. |
| **Branch / Office Location** | Mandatory (≥1) | 1..n per Legal Entity | Physical/registered address, relevant for PT (Professional Tax, India) which is often location-dependent, and for attendance geo-fencing. |
| **Work Location** | Optional | 0..n per Employee (effective-dated) | Finer-grained than Branch — could be "Remote," "Client Site — X," a specific floor/desk. Distinct from Branch because an employee's statutory PT location (Branch) and their actual day-to-day work location (Work Location, e.g. permanently remote) can differ. |
| **Designation / Job Title** | Mandatory | 1 per Employee (effective-dated) | The employee-facing title. Related to but distinct from Grade/Band (§6). |
| **Job / Position** | Optional for MVP, required for Enterprise release's headcount/vacancy tracking (Module 2) | 0..1 per Employee (a Position can be vacant; an Employee occupies at most one Position at a time) | Position management (a Position exists independently of who fills it, enabling vacancy tracking and headcount planning) is an **Enterprise-release** capability per the suggested roadmap — MVP can operate on Designation alone without full Position management. |
| **Grade / Band / Level** | Mandatory | 1 per Employee (effective-dated) | Compensation-and-career-framework anchor (§6). |
| **Payroll Group** | Mandatory | 1 per Employee (effective-dated) | Determines pay schedule, statutory ruleset, salary-structure template applicability. Usually aligned to Legal Entity but can subdivide further (e.g., different payroll groups for different employee categories within one entity — monthly-paid staff vs. daily-wage workers). |
| **Shift Group** | Mandatory for employees with attendance tracking | 1 per Employee (effective-dated) | Determines applicable shift pattern/timing rules. |
| **Holiday Calendar** | Mandatory | 1 per Employee (effective-dated), typically derived from Branch/Location but overridable | India's holiday calendars vary meaningfully by state — this must be assignable independently of a single org-wide calendar. |
| **Leave Policy Group** | Mandatory | 1 per Employee (effective-dated) | Determines applicable leave types/accrual rules — often varies by employment type, grade, or location (statutory minimums vary by state). |
| **Attendance Policy Group** | Mandatory | 1 per Employee (effective-dated) | Grace periods, regularisation limits, overtime eligibility rules. |
| **Employment Type** | Mandatory | 1 per Employee (effective-dated) | Permanent, Fixed-term Contract, Intern, Consultant, Part-time, etc. Has downstream effects on Leave/Payroll/Compliance eligibility — should be a first-class, not a free-text, field. |
| **Worker Type** | Optional distinction from Employment Type | 1 per Employee | Distinguishes on-payroll employees from off-payroll workers (e.g., contractors/gig workers/vendor staff) who may need limited HRMS access (badge access, asset assignment) without being full payroll employees — relevant to Module 25 India's growing contract workforce and Persona 14 (External Consultant). |
| **HR Business Partner (HRBP)** | Optional | Assigned per Department/Business Unit/Legal Entity, not per-employee | An assignment relationship (which HRBP covers which org unit), not a reporting line — an employee's HRBP is derived from their department/entity assignment, not set individually per employee (unless an override is needed for an exception case). |

---

## 4. Parent-child relationships and referential rules

- **Tenant → Organisation → Legal Entity → (Business Unit) → Department → (Sub-Department) → (Team):** strict parent-child, single-parent tree. An org unit cannot exist without its parent existing first (referential integrity), and deleting/deactivating a parent must cascade a defined policy to children (soft-delete or reassignment prompt — never a hard cascade delete given audit/compliance requirements, see Phase 11).
- **Location hierarchy is independent of the org-unit tree** — a Department can span multiple Branches (e.g., "Sales" department has people in Mumbai and Bangalore branches); a Branch can host multiple Departments. This is a many-to-many relationship realised at the Employee level (each employee has one current Department and one current primary Work Location, but the Department and Branch entities themselves aren't parent-child).
- **Cost Centre is a cross-cutting assignable attribute**, not nested under Department — explicitly to support the common real case where Finance's cost-centre structure doesn't mirror HR's department structure (see Persona 8, Finance User pain points).
- **Employee-to-org-unit assignment (Department, Legal Entity, Location, etc.) is always effective-dated**, modelled as a distinct "Employment Assignment" record type (see §7), not as mutable fields directly on the Employee master record. The Employee master record holds identity/biographical data that changes rarely and isn't typically effective-dated in the same way (though even there, some fields like legal name may need historical tracking for document-generation accuracy).

---

## 5. Reporting hierarchy, matrix management, and HRBP assignment

This is explicitly called out in the brief ("multiple reporting lines," "functional manager," "dotted-line manager") and is one of the more architecturally significant decisions:

- **Functional Manager (primary):** exactly one at any point in time, effective-dated. This is the manager whose approval authority is the default for leave/attendance/expense approvals and who appears as "manager" in the org chart's primary view.
- **Dotted-line Manager(s):** zero or more, effective-dated, each with a defined **purpose/scope** (e.g., "project reporting," "regional matrix") — not just a second manager with undefined authority. The permission model (Module 21) needs to decide, per deployment, whether dotted-line managers get approval authority or visibility-only — **this should be a configurable policy per relationship type, not hard-coded.**
- **HRBP assignment** is a coverage relationship (which HRBP owns which org unit's people-processes), resolved to an individual employee's HRBP via their current Department/Entity assignment, with the ability to override at the individual level for edge cases (e.g., a senior leader whose HRBP is the CHRO directly, bypassing the department-level default).
- **Acting Manager / Delegated Approval:** a **temporary, time-boxed override** of who can act in the Functional Manager's approval capacity (e.g., manager on leave) — modelled as a separate delegation record, not a change to the effective-dated Functional Manager relationship itself, because the underlying reporting relationship hasn't actually changed, only who's temporarily exercising the approval authority. This distinction matters for audit clarity (Module 17, Module 21).

**Org chart implication:** the org chart (Module 1/2) should default to rendering the Functional Manager tree (the "primary" view most users expect) with dotted-line relationships as a togglable overlay, not the default view — avoids a cluttered chart for the common case while still supporting matrix visibility when needed.

---

## 6. Designation, Grade, Band, Level — how they relate

These four terms are used loosely and inconsistently across the industry (and even within a single competitor's own documentation, per Phase 2 research). This PRD defines them distinctly to avoid ambiguity in later module PRDs:

- **Job Title / Designation:** the external/employee-facing title (e.g., "Senior Software Engineer"). Can vary in naming even for the same Grade across different job families.
- **Job Level:** a numeric or ordinal seniority indicator, often comparable across job families (e.g., "L4"), used for career-framework and cross-functional comparison.
- **Grade:** the compensation-relevant classification that maps to a salary range/band and often to benefits eligibility. This is the field payroll/compensation logic should key off — **not** Designation, which is a display/HR label that can change (e.g., a title change/promotion) somewhat independently of a Grade change, and vice versa (a lateral designation change with no grade change, or a grade change without a title change in some org designs).
- **Band:** a grouping of adjacent Grades sharing a compensation range or approval-authority threshold (e.g., "Band C" spans Grades C1–C3), primarily used to simplify approval-workflow rules (Module 17) — "compensation changes above Band D require CXO approval" is easier to configure and reason about than per-grade rules.

**Design rule carried into Module 1 (Core HR) and Module 6 (Payroll):** compensation/salary-structure logic should reference **Grade**, not Designation — this avoids a whole class of bugs where a title-only change accidentally triggers unintended payroll/benefits recalculation, and conversely ensures a real grade change (even without a title change) does correctly trigger the relevant approval/payroll workflows.

---

## 7. Effective-dated changes — the "Employment Assignment" pattern

To make effective-dating concrete rather than abstract, this section defines the pattern module PRDs should reference.

**Pattern:** rather than storing Department/Manager/Location/Grade/Designation/Employment-Type/Payroll-Group/etc. as mutable fields directly on an Employee record, these are modelled as an append-only sequence of **Employment Assignment** records, each with:
- `effective_from` (mandatory)
- `effective_to` (nullable — null means "current, until superseded")
- The full set of assignment attributes valid for that period (Department, Manager(s), Location, Grade, Designation, Employment Type, Payroll Group, Shift Group, Leave Policy Group, Attendance Policy Group, Cost Centre)
- `reason_code` (e.g., "Promotion," "Transfer," "Annual Revision," "Correction") — required, because "what changed" without "why" is insufficient for audit (Phase 11) and for downstream workflow logic (a Promotion-reason change should trigger different notifications/approvals than a routine Transfer)
- `initiated_by`, `approved_by`, `approval_reference` (linking to the Module 17 workflow instance that authorised this change, where applicable)
- `created_at`, `superseded_at` (system audit timestamps, distinct from the business-effective dates above — this distinction matters: a correction entered today with an effective date of three months ago has a `created_at` of today but an `effective_from` of three months ago; both must be independently queryable)

**Why this matters practically:**
- **"Who was the manager on date X" queries** become a simple range query over Employment Assignment records, rather than requiring a slow/unreliable audit-log replay.
- **Retroactive corrections** (explicitly required — "employee data correction after payroll closure," "retroactive salary revision," both named as cross-module workflows in the brief) are modelled naturally: a new Employment Assignment record with a `reason_code` of "Correction" and an `effective_from` in the past, **without deleting or silently overwriting the erroneous record** — the erroneous record stays in history (superseded, not erased) for audit purposes, per Phase 11's "immutable audit records" requirement.
- **Promotion/transfer/manager-change/location-change/compensation-revision** (all named explicitly in the brief as things needing "handling") are all realised as the *same underlying pattern* — a new Employment Assignment record with the relevant `reason_code` — rather than needing bespoke schema per change type. This is a meaningful simplification for Module 1/2's implementation.

**Employee master record**, by contrast, holds data that is not assignment-related: legal identity, contact info, emergency contacts, dependants, education, government IDs, bank details. Some of *these* fields also warrant their own historical tracking (e.g., a bank-account change needs an audit trail for payroll-fraud-prevention reasons — see Module 6 and Phase 11) but via a lighter-weight "field history" pattern rather than the full Employment Assignment structure, since these aren't "assignments" in the organisational sense.

---

## 8. Employee transfer, promotion, and manager-change handling

Building directly on §7's Employment Assignment pattern:

| Change type | What changes in the Employment Assignment | Typical trigger/reason_code | Cross-module effects to consider |
|---|---|---|---|
| **Department transfer** | Department (and possibly Sub-Department/Team, Cost Centre, HRBP-derived-assignment) | "Transfer" | New manager likely follows from new department (unless explicitly kept); approval workflow routes to both old and new department heads typically; Module 17 |
| **Legal-entity transfer** | Legal Entity, Payroll Group, potentially Employment Type/statutory registrations | "Inter-entity Transfer" | This is the most consequential transfer type — it can trigger a full-and-final settlement in the old entity and a fresh joining in the new entity, or a "continuous service" treatment, depending on jurisdiction and company policy; **flagged as needing legal/payroll-compliance review** (India: whether PF/gratuity continuity is preserved across group-entity transfers is a real, non-trivial compliance question) — see Open Questions and Cross-Module Workflow #4 |
| **Promotion** | Grade, Band, Designation, Job Level (often together); frequently accompanied by a Compensation change | "Promotion" | Should trigger Module 9 (Performance)'s promotion-recommendation linkage where applicable, Module 6 (Payroll)'s salary-revision processing, and Module 13 (Documents)'s promotion-letter generation — Cross-Module Workflow #5/#6 |
| **Manager change** | Functional Manager (and re-evaluation of Dotted-line Managers) | "Manager Change" (could be standalone, e.g. reorg, or a side-effect of a Department transfer) | Should re-point any in-flight approval workflows correctly (an open leave request awaiting the old manager's approval needs a defined resolution policy — auto-reassign to new manager vs. let old manager finish pending approvals — **flagged as an explicit business-rule decision needed in Module 17**) |
| **Location/Work-location change** | Branch and/or Work Location, potentially Holiday Calendar, Attendance Policy Group (geo-fencing rules) | "Location Change" | Can have PT (Professional Tax) implications if Branch changes state — Module 6 compliance impact |
| **Compensation revision** | Not itself an Employment Assignment field change necessarily (Grade may stay the same for an off-cycle/annual revision without a Grade change) — modelled as its own effective-dated Compensation record, linked to but distinct from Employment Assignment, since compensation can change without any assignment change (annual increment) and vice versa (a lateral transfer with no pay change) | "Annual Revision," "Off-cycle Revision," "Promotion-linked" | Module 6's core "salary revision" and "retroactive salary changes" functionality — see Module 6 |

**Design implication:** Compensation is modelled as its **own effective-dated entity**, separate from Employment Assignment, precisely because the two change independently often enough that conflating them would force artificial "assignment changes" just to record a pay change, or vice versa.

---

## 9. Historical hierarchy preservation

Directly required by the brief. Concretely, this means:
- Org-unit entities (Department, Legal Entity, Business Unit, etc.) are themselves **soft-deleted/deactivated, never hard-deleted**, and ideally also effective-dated at the entity level (a Department can be renamed, merged, or split — each should be a traceable event, not a silent overwrite) — this is called out as a later-phase nuance (full org-unit effective-dating) vs. MVP's simpler "deactivate and reassign" pattern; flagged in Module 2.
- Reporting-hierarchy queries for a past date must return the org structure **as it existed then**, not the current structure retroactively applied — this is why Employment Assignment records carry the full attribute set valid for their period, rather than being thin pointers into always-current org-unit records.
- **Reorganisation events** (explicitly listed as a cross-module workflow — "organisation restructuring") should be modelled as a **batch of Employment Assignment changes sharing a common `reason_code` and a linking "reorg event" reference**, so the historical record shows "these 40 employees moved departments together as part of Reorg-2026-Q3," which is both more auditable and more useful for reporting than 40 unrelated-looking individual transfer records.

---

## 10. Cross-entity access and tenant data isolation

- **Tenant isolation is absolute** (Phase 11 will define the technical mechanism — e.g., row-level tenant-ID scoping enforced at the data-access layer, not just application-logic checks). No entity in this model is ever shared or visible across tenants under any circumstance. This is a hard requirement, not a configurable policy.
- **Cross-legal-entity access within one tenant** is a real, common requirement (a shared-services HR team supporting multiple legal entities within one corporate group) and should be modelled as an explicit **scope grant** on a user's role (Module 21's "legal-entity access" concept), not assumed by default — the default should be entity-scoped access, with broader access requiring an explicit, auditable grant.
- **Cross-department/location/team access** follows the same principle at a finer grain — People Manager scope is reporting-hierarchy-derived (§5), HR roles' scope is explicitly granted (department-list, location-list, or "all"), per Module 21.
- **Data residency** (where tenant data is physically stored) is a Phase 11 concern, but is noted here because it interacts with this model's Legal Entity concept for multi-country future expansion — a tenant with legal entities in multiple countries may have data-residency obligations that differ per country, which the Legal Entity entity should be capable of carrying as metadata (e.g., `data_residency_region`) even if not used in the India-first MVP.

---

## 11. Open questions

- **OQ-8:** Is multi-organisation-per-tenant (a holding-company structure with genuinely separate sub-organisations under one billing tenant) an MVP requirement? Recommend deferring — flagged for stakeholder confirmation before Module 2/22 finalise the setup flow.
- **OQ-9:** For inter-legal-entity transfers within the same corporate group, does Indian statutory practice (and this specific customer base's typical practice) treat this as continuous service (PF/gratuity carry over) or as an exit-and-rejoin? This materially affects Module 6 (Payroll) and Module 15 (Separation) design and **needs input from a qualified payroll/legal professional**, per the brief's own instruction to flag such items rather than assume.
- **OQ-10:** Should org-unit entities (Department, Business Unit) be fully effective-dated at the entity level (supporting rename/merge/split as first-class historical events) in MVP, or is "deactivate old, create new, manually reassign" an acceptable MVP simplification with full effective-dating deferred to a later phase? Recommend the simplification for MVP given implementation cost, revisit at Enterprise-release scope (Module 2).
- **OQ-11:** How is HRBP override handled at scale — is a per-employee override common enough to need first-class UI support in MVP, or is department-derived HRBP assignment sufficient initially?
- **OQ-12:** Should Cost Centre be mandatory at MVP for mid-market/enterprise tenants (given Finance User persona's needs) even though it's listed as optional above for SMB simplicity? Recommend tenant-configurable mandatoriness rather than a single global rule — flagged for Module 22 setup-flow design.
