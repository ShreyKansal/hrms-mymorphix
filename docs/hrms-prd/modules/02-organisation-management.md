# Module 2 — Organisation Management

**Status:** Draft v1 (pending stakeholder review) · **Release:** Foundation (core structure) / Enterprise (Position Management, Headcount Planning)
**Depends on:** [05-organisation-data-model.md](../05-organisation-data-model.md) (this module is that data model's primary CRUD/admin surface — read that document first; this one avoids re-deriving what's already specified there)

---

## 1. Module overview

The administrative surface for creating and maintaining the organisational structure defined in [05-organisation-data-model.md](../05-organisation-data-model.md): legal entities, business units, departments, teams, locations, cost centres, grades/bands/designations/job levels, and (Enterprise-phase) positions and headcount plans. Module 1 consumes this structure when assigning employees to it; this module owns the structure itself.

## 2. Problem statement

Every competitor researched supports basic department/location setup, but none was confirmed to cleanly separate the four independent dimensions (org-unit tree, location, cost centre, reporting hierarchy) that [05](../05-organisation-data-model.md) §2/§4 identifies as necessary for matrix organisations — a common real-world cause of "the org chart doesn't match how we actually work" complaints.

## 3. Business objective

Let HR/System Administrators model the organisation's true structure — including matrix reporting, multi-location departments, and cost centres that don't mirror the department tree — without forcing artificial simplification, while keeping the common (simple, single-entity, tree-shaped) case fast to set up.

## 4. User personas

Primary: **HR Administrator**, **System Administrator** (initial tenant setup, Module 22 overlap). Secondary: **Department Head** (view/request headcount within scope), **Finance User** (cost-centre configuration input), **Leadership/CXO** (org-wide structure visibility).

## 5. User needs

Fast initial setup for a simple single-entity org; the ability to add complexity (business units, cost centres, matrix reporting) progressively as the org grows, without a forced re-platforming; confidence that restructuring won't silently break historical reporting (per [05](../05-organisation-data-model.md) §9).

## 6. Primary use cases

Set up legal entity/department/location hierarchy at tenant onboarding; add/rename/deactivate a department; configure cost centres and their mapping to departments; define grade/band/designation catalogues; run an org restructuring event affecting many employees at once; (Enterprise) create/track vacant positions and headcount plans.

## 7. Detailed workflows

### 7.1 Organisation restructuring (batch reorg)

- **Trigger:** Leadership-approved reorg (e.g., merging two departments, splitting one into three).
- **Preconditions:** Actor is HR Administrator with org-structure-edit permission; affected employees identified and reviewed.
- **Actor:** HR Administrator, typically with Department Head/Leadership sign-off captured outside the system or via Module 17 workflow.
- **Steps:** 1) Create/deactivate/rename the relevant org-unit entities 2) Build the batch employee-reassignment list (bulk action, referencing Module 1 §17) 3) Assign a shared `reorg_event` reference and common `reason_code = "Reorganisation"` to every resulting Employment Assignment change 4) Preview impact (headcount shift per unit, any orphaned reporting lines) before commit 5) Commit — all changes take effect together at the specified effective date.
- **Decision points:** Any employee left without a valid manager or department post-reorg blocks commit until resolved.
- **System actions:** Bulk-create Employment Assignment records (Module 1 §7.2 mechanics, batched); mark old org units as deactivated (not deleted, per [05](../05-organisation-data-model.md) §9) with an `effective_to` if entity-level effective-dating is enabled (Enterprise phase) or an inactive flag (MVP simplification).
- **Notifications:** All affected employees and managers, in a single consolidated "your department has changed as part of [reorg name]" notification rather than one notification per unrelated-looking field change.
- **Failure handling:** Partial-commit is explicitly disallowed — the batch either fully commits or fully rolls back, given the confusion a half-applied reorg would cause.
- **Audit events:** Single `OrganisationRestructured` event referencing the batch, plus the individual `EmployeeTransferred` events per Module 1 §7.2, all cross-linked by `reorg_event` ID.

## 8. User stories

**US-1**
As an **HR Administrator**, I want to add a new Department under an existing Legal Entity without affecting any other entity, so that routine org growth doesn't require a risky, all-at-once change.
**Acceptance criteria:** Given a new Department is created with no employees assigned yet, when viewed in the org chart, then it appears as an empty, valid unit ready for assignment — not an error state.

**US-2**
As a **Department Head**, I want to request a new headcount/position for my team, so that Recruitment (Module 8) can act on an approved, budgeted requisition rather than an informal request.
**Preconditions:** Position Management enabled (Enterprise phase — flagged, not MVP).
**Acceptance criteria:** Given a headcount request exceeds the department's approved budget, when submitted, then the system flags the variance for Finance User review before HR/Recruitment can act on it.

## 9. Functional requirements

CRUD for Legal Entity, Business Unit, Department, Sub-Department, Team, Location/Branch, Cost Centre, Grade, Band, Designation, Job Level per [05](../05-organisation-data-model.md) §3; org chart rendering (Functional Manager tree by default, dotted-line overlay togglable, per [05](../05-organisation-data-model.md) §5); (Enterprise) Position entity with vacancy status, headcount plan vs. actual tracking, department-leadership assignment (who is the head of a given unit — a first-class relationship, not inferred).

## 10. Business rules

An org unit cannot be deleted if employees or child units are currently assigned to it — must be deactivated (soft) with a mandatory reassignment prompt, per [05](../05-organisation-data-model.md) §4/§9. Cost Centre assignment is independent of Department assignment (may be set at Department, Position, or Employee level, per tenant configuration — see [05](../05-organisation-data-model.md) §3 and Persona 8's Finance User needs).

## 11. Validation rules

Legal Entity requires at least one statutory identifier field set before Payroll module can process it (cross-module validation with Module 6); Department requires a parent Legal Entity or Business Unit; Grade/Band consistency check (a Grade must belong to exactly one Band).

## 12. Permission requirements

Org-structure edit rights are HR-Administrator/System-Administrator tier, not HR-Executive — structural changes have wide blast radius (per [04](../04-personas-and-roles.md) Persona 4's "low-frequency, high-risk workflows" note). Department Heads get read + headcount-request rights within their own unit only.

## 13. Approval workflows

Reorg events and new Legal Entity creation should route through Module 17 with Leadership/Finance sign-off as a configurable requirement — this module doesn't hard-code who approves, it defines the trigger points.

## 14. Statuses and state transitions

Org unit: **Active → Inactive** (soft-deactivated, one-way in MVP per [05](../05-organisation-data-model.md) §9's simplification decision; Enterprise phase may add full effective-dating with reactivation). Position (Enterprise): **Open → Filled → Vacant (backfill) → Closed**.

## 15. Record detail-page requirements

Department/Legal Entity detail page: header (name, parent, head-of-unit, headcount count), tabs for Sub-units, Assigned Employees (link to filtered Module 1 directory, not a duplicated table), Cost Centre Mapping, History (reorg events affecting this unit).

## 16. Search, filter and sorting requirements

Org-unit picker (used throughout the product wherever a department/location is selected) needs typeahead search and hierarchy-aware display (breadcrumb-style, e.g., "Engineering > Platform > Infra") given deep nesting is possible.

## 17. Bulk-action requirements

Batch reorg (§7.1) is the primary bulk action; bulk cost-centre remapping.

## 18. Import and export requirements

Org-structure import (for initial tenant setup, especially migrating from a competitor product) as a structured template (parent-child CSV or similar), with a validation/preview step before commit given how foundational this data is.

## 19. Notification requirements

Reorg-affected notification (§7.1); new Department/Legal Entity created (to relevant System Administrators for downstream setup awareness — e.g., a new Legal Entity needs Payroll configuration, Module 6).

## 20. Mobile requirements

Read-only org chart browsing; headcount-request submission (Department Head). Structural edits are desktop-only.

## 21. Reporting requirements

Headcount by unit (current and historical trend); (Enterprise) budget-vs-actual headcount, vacancy-ageing report.

## 22. Audit-log requirements

Every org-unit create/rename/deactivate, every reorg event, every cost-centre remap — full before/after per Phase 11.

## 23. Integration requirements

Feeds Module 1 (employee assignment), Module 6 (Payroll — Legal Entity/Cost Centre for statutory and GL-export purposes), Module 8 (Recruitment — Position/requisition linkage, Enterprise phase).

## 24. Error, empty, and edge cases

**Error states:** attempting to deactivate a unit with active employees (block, prompt reassignment). **Empty states:** new tenant setup wizard should not present an intimidating blank multi-entity structure — default to a single Legal Entity/Department, with "add complexity" as an explicit progressive-disclosure step (per [00-existing-system-audit.md](../00-existing-system-audit.md) §4's grid/IA guidance principle). **Edge cases:** a Department that spans multiple Locations (explicitly supported per [05](../05-organisation-data-model.md) §4 — not an error); circular reporting/parent references (must be structurally prevented, not just discouraged).

## 25. Acceptance criteria

Given a reorg event is committed, when any employee's historical Employment Assignment is queried for a date before the reorg, then it correctly returns the pre-reorg org structure, not the current one (direct consequence of [05](../05-organisation-data-model.md) §9's historical-hierarchy-preservation requirement).

## 26. Dependencies

[05-organisation-data-model.md](../05-organisation-data-model.md); Module 1 (employee assignment); Module 22 (tenant setup wizard, numbering schemes).

## 27. Risks

Over-engineering the initial-setup flow with every possible entity (Business Unit, Cost Centre, multiple Location layers) up front risks scaring off SMB customers who need none of it — mitigated by the progressive-disclosure principle above, but worth explicit UX-design attention, not just a data-model afterthought.

## 28. Open questions

Carries forward OQ-8, OQ-10, OQ-12 from [05-organisation-data-model.md](../05-organisation-data-model.md) unchanged — this module is where those data-model decisions become concrete UI/workflow commitments, so they should be resolved before this module's detailed UI spec (not this PRD phase) begins.

## 29. Release scope

**MVP:** Legal Entity, Department, Sub-Department, Team, Location, Cost Centre, Grade/Band/Designation CRUD; basic org chart; reorg batch workflow.
**Later phase (Enterprise):** Position Management, headcount planning/budget tracking, full entity-level effective-dating (rename/merge/split as historical events).
**Out of scope:** financial/GL chart-of-accounts management itself (this module supplies Cost Centre as a dimension Finance's accounting system consumes — it does not become the accounting system, per [03-product-vision.md](../03-product-vision.md) Product Boundaries).
