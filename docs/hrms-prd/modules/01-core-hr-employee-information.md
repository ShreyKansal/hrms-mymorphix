# Module 1 — Core HR and Employee Information System

**Status:** Draft v1 (pending stakeholder review) · **Release:** Foundation
**Depends on:** [04-personas-and-roles.md](../04-personas-and-roles.md), [05-organisation-data-model.md](../05-organisation-data-model.md)

---

## 1. Module overview

The Employee Master is the single source of truth for every person's identity, employment, and lifecycle data — the record every other module (Attendance, Leave, Payroll, Performance, Documents, Assets) reads from and, in narrow controlled ways, writes to. This module owns the Employee entity, the Employment Assignment history defined in [05-organisation-data-model.md](../05-organisation-data-model.md) §7, the employee directory/org chart, and the mechanics of every lifecycle change (transfer, promotion, manager change, status change) other than the specialised flows (onboarding itself is Module 3, separation is Module 15) that trigger them.

## 2. Problem statement

Competitor research (see [01-market-research.md](../01-market-research.md) §8) found that HR/attendance/payroll data staying in sync across systems is a near-universal weak point — most sharply evidenced by Zoho People's confirmed one-way sync to Zoho Payroll. When the employee record isn't a genuine single source of truth with proper history, every downstream module either duplicates data (creating drift) or reads stale/wrong values (creating payroll and compliance risk).

## 3. Business objective

Give every other module one authoritative, effective-dated, audit-complete employee record to depend on, so that "who is this person, what's their current and historical employment status, and who approved each change" is never ambiguous — and so a change made once (e.g., a transfer) doesn't need to be re-entered in three systems.

## 4. User personas

Primary: **HR Executive**, **HR Administrator** (create/maintain records). Secondary: **Employee** (self-service edits to a defined field subset), **People Manager** (read own-team scope, initiate transfer/promotion requests), **Payroll Executive/Administrator** (read compensation/statutory fields), **IT Administrator** (read for provisioning, not HR-content — see [04](../04-personas-and-roles.md) §11's least-privilege note), **Compliance/Audit User** (read-only, full history). Full persona detail: [04-personas-and-roles.md](../04-personas-and-roles.md).

## 5. User needs

- HR needs to create a complete, accurate record once and have it flow everywhere else.
- Employees need to keep their own low-risk data (address, emergency contact) current without a ticket.
- Managers need an accurate, current view of who's on their team and that view's history.
- Payroll needs guaranteed-accurate compensation/statutory/bank data with a clear change trail.
- Everyone needs the org chart and directory to reflect reality, including mid-cycle changes.

## 6. Primary use cases

Create employee record (from onboarding or direct entry); view/edit own profile (ESS); view/edit team member records (HR/manager, scoped); process a transfer/promotion/manager-change/location-change/compensation-revision; browse employee directory and org chart; search for an employee; mark an employee record status change (active/on-leave/suspended, distinct from Separation's terminal states — see §14); bulk-import employee data; manage custom fields.

## 7. Detailed workflows

### 7.1 Employee record creation (direct entry, not via onboarding)

- **Trigger:** HR Administrator creates a record outside the onboarding flow (e.g., historical/migrated data, or an off-cycle hire not routed through Recruitment).
- **Preconditions:** Actor has create permission scoped to the target legal entity/department.
- **Actor:** HR Administrator or HR Executive.
- **Steps:** 1) Enter mandatory identity fields (legal name, DOB, gender, government ID per §11) 2) Enter initial Employment Assignment (department, designation, grade, manager, payroll group, location — per [05](../05-organisation-data-model.md) §7) 3) System generates Employee ID per configured numbering scheme (Module 22) 4) System validates mandatory fields and uniqueness (government ID, email) 5) Record saved in "Active" status with `effective_from` = joining date.
- **Decision points:** Duplicate-ID/government-ID detection → block or flag for override with justification (never silent-merge).
- **System actions:** Provision Employee ID; create initial Employment Assignment record; trigger downstream provisioning events (`EmployeeCreated`, see [09-api-and-event-planning.md](../09-api-and-event-planning.md)) for IT/Payroll/Directory sync.
- **Notifications:** HR Administrator confirmation; if linked to onboarding, triggers Module 3.
- **Failure handling:** Validation failure returns field-level errors, no partial record persisted (atomic creation).
- **Final outcome:** New Employee + initial Employment Assignment record, directory-visible per default privacy settings.
- **Audit events:** `EmployeeCreated` with full initial-state snapshot, actor, timestamp.

### 7.2 Employment Assignment change (transfer / promotion / manager change / location change)

- **Trigger:** HR/Manager initiates a change, or an approved workflow (e.g., Performance module's promotion recommendation) completes.
- **Preconditions:** Actor has edit permission scoped appropriately; target employee not in a payroll-locked period for changes with payroll effect unless using the correction path (§7.3).
- **Actor:** HR Executive/Administrator (most changes); People Manager (can initiate, rarely can unilaterally approve — see Module 17).
- **Steps:** 1) Actor selects change type and enters new values + effective date + reason_code (mandatory, per [05](../05-organisation-data-model.md) §7) 2) System evaluates whether approval is required (Module 17 rules — e.g., promotions and inter-entity transfers almost always require approval; a location update might not) 3) If approval required, workflow instance created, change held in "Pending" state 4) On approval, new Employment Assignment record created with `effective_from` as specified, old record's `effective_to` set 5) Downstream events fired.
- **Decision points:** Effective date in the past (retroactive) vs. future vs. today — retroactive changes to a period that's already been paid require the correction path (§7.3), not this standard path, and should be blocked with a clear message pointing to it.
- **Approval logic:** Configurable per change type/grade/amount threshold per Module 17 (e.g., "promotions above Band D require CXO approval," from [05](../05-organisation-data-model.md) §6).
- **System actions:** Create new Employment Assignment; if Manager changed, resolve in-flight approvals per the policy decision flagged in [05](../05-organisation-data-model.md) §8 ("Manager change" row); if inter-entity transfer, potentially trigger Module 15 (partial settlement) and Module 3 (re-onboarding) per Cross-Module Workflow #4.
- **Notifications:** Old and new manager, HRBP, affected employee, Payroll (if payroll-relevant fields changed).
- **Failure handling:** Approval rejection returns the request to "Returned for Correction" or "Rejected" (see §14); no partial application.
- **Final outcome:** New effective-dated Employment Assignment; employee directory/org chart reflect it from the effective date forward.
- **Audit events:** `EmployeeTransferred` / `EmployeePromoted` / role-appropriate event, with before/after snapshot, reason_code, approval reference.

### 7.3 Retroactive correction (post-payroll-lock)

- **Trigger:** An error is discovered in a past Employment Assignment or master-data field, and the affected period has already been paid/locked in Payroll.
- **Preconditions:** Requires elevated permission (HR Administrator, not HR Executive) given the payroll/compliance sensitivity — see Cross-Module Workflow #18.
- **Steps:** 1) Actor creates a correction request with `reason_code = "Correction"`, the true `effective_from` date, and a mandatory justification note 2) System flags this as touching a locked payroll period and routes to Payroll Administrator for co-approval (dual-control) 3) On approval, a new Employment Assignment record is created effective from the correct historical date, **superseding but not deleting** the erroneous record 4) Payroll module is notified to include this in the next off-cycle/regular run's retroactive adjustment (Module 6).
- **Failure handling:** If Payroll Administrator rejects (e.g., disputes the correction), request returns to submitter with the reason.
- **Audit events:** Full before/after, both approvers, explicit "this record was corrected retroactively" flag visible on the record's timeline (§15) — never silently indistinguishable from a normal edit.

## 8. User stories

**US-1**
As an **HR Executive**, I want to update an employee's department and manager in one transfer action, so that I don't have to make two disconnected edits that could leave the record briefly inconsistent.
**Preconditions:** Employee is Active; actor has edit scope over both source and target departments.
**Main flow:** 1. Open employee record 2. Select "Transfer" 3. Enter new department (manager defaults from new department, overridable) 4. Enter effective date and reason 5. Submit.
**Alternate flows:** If new department requires a different payroll group, system prompts to confirm the payroll-group change as part of the same transaction.
**Validation rules:** Effective date cannot be in a payroll-locked past period; reason_code mandatory.
**Permissions:** HR Executive with department-transfer scope covering both departments.
**Acceptance criteria:**
Given an employee is being transferred to a department in a different payroll group, when the HR Executive submits the transfer without addressing the payroll-group change, then the system blocks submission and requires an explicit payroll-group decision.
Given a transfer's effective date falls within an already-locked payroll period, when submitted, then the system blocks the standard transfer path and directs the user to the retroactive-correction workflow (§7.3).

**US-2**
As an **Employee**, I want to update my own address and emergency contact, so that I don't need to raise an HR ticket for routine personal-detail changes.
**Preconditions:** Field is marked self-service-editable per Module 22 configuration.
**Main flow:** 1. Open own profile 2. Edit address/emergency contact fields 3. Save — no approval required for these low-risk fields by default.
**Validation rules:** Address format validation; emergency contact requires at least one phone number.
**Permissions:** Employee, self-scope, self-service-editable fields only.
**Acceptance criteria:** Given an employee edits a field not marked self-service-editable (e.g., designation), when they attempt to save, then the field is read-only and not submittable through ESS.

**US-3**
As a **Payroll Administrator**, I want every change to an employee's bank account details to be logged with the old and new values and require step-up confirmation, so that payroll-fraud risk from a compromised HR account is mitigated.
**Acceptance criteria:** Given a bank-account field is changed, when saved, then an immutable audit record captures old value (masked appropriately), new value (masked appropriately), actor, timestamp, and IP; and a notification is sent to the employee's registered contact channel confirming the change (a common fraud-detection pattern — if the employee didn't make the change, they're alerted immediately).

## 9. Functional requirements

Employee master profile with all field groups listed in the brief (personal, contact, emergency contact, employment, job, reporting manager, department/location, grade/designation/band, employment status/type, probation, confirmation, compensation, bank, tax, government IDs, work authorisation, education, previous employment, skills, certifications, dependants, nominees, assets-assigned [reference to Module 14], documents [reference to Module 13], notes, custom fields); Employee ID generation (configurable numbering scheme, Module 22); effective-dated Employment Assignment history per [05](../05-organisation-data-model.md) §7; employee timeline (chronological view of every change, see §15); employee directory with search; org chart (derived from current Functional Manager assignments, per [05](../05-organisation-data-model.md) §5); profile-completeness indicator; sensitive-field masking (§12).

**ESOP grant record (added 2026-07-23, per [16-product-decision-log.md](../16-product-decision-log.md) D-014):** a lightweight entity — grant date, instrument type, quantity, vesting schedule, exercise events — linked to the employee record, sitting alongside Compensation as a distinct effective-dated data point (not folded into Compensation itself, since equity and cash compensation vest/change independently). Owned here as employee data; the payroll-relevant tax treatment on exercise is Module 6's responsibility (Module 6 §9).

## 10. Business rules

- Every Employment Assignment change requires a `reason_code` — no free-floating edits to org-relevant fields.
- Compensation changes are modelled as their own effective-dated entity, not folded into Employment Assignment (per [05](../05-organisation-data-model.md) §8).
- An employee has exactly one current Functional Manager, Department, Legal Entity, Payroll Group at any point in time (never zero, never two — enforced at the data layer).
- Retroactive changes into a locked payroll period always require the correction path (§7.3) with Payroll Administrator co-approval — never the standard-edit path.
- Government ID fields (Aadhaar, PAN) must be unique per tenant (duplicate detection blocks save, with an explicit override-with-justification path for genuine edge cases like re-issued IDs).

## 11. Validation rules

Mandatory-at-creation: legal name, DOB, gender, at least one government ID appropriate to employment type, department, designation, grade, manager (unless top-of-hierarchy), employment type, joining date. Format validation: PAN (10-char alphanumeric pattern), Aadhaar (12-digit, with masking on display per §12), IFSC/bank account (format + optional penny-drop verification, integration-dependent — see Module 23), email (uniqueness + format), phone (format). Cross-field validation: probation end date must be after joining date; confirmation cannot be recorded before probation end unless probation is explicitly waived.

## 12. Permission requirements

Field-level, not just record-level, per [04](../04-personas-and-roles.md)'s cross-persona notes: compensation/bank/statutory-ID fields visible only to Payroll Executive/Administrator, HR Administrator (scoped), the employee themself (own record), and their direct HR Administrator — not to People Managers or general HR Executives by default. Sensitive-field masking (e.g., Aadhaar shown as `XXXX-XXXX-1234`) applies even to users with view access unless they have an explicit "unmask" permission, itself logged per access (Phase 11's bulk-download/privileged-access monitoring).

## 13. Approval workflows

Routed through Module 17 (Workflow and Approval Engine); this module defines *which* changes need approval and at what threshold (configurable per tenant, sensible defaults): new-hire creation — none (creation itself is the authorisation); department transfer — manager of losing + gaining department; inter-entity transfer — HR Administrator + Payroll Administrator (settlement implications); promotion — per grade/band threshold (see [05](../05-organisation-data-model.md) §6); compensation revision — per amount/percentage threshold; retroactive correction — HR Administrator + Payroll Administrator dual control (§7.3).

## 14. Statuses and state transitions

Employee **record status** (distinct from Employment Assignment history and distinct from Separation's terminal states, Module 15):

| State | Entry condition | Allowed actions | Allowed actors | Next states | Payroll impact |
|---|---|---|---|---|---|
| Draft | Record created via onboarding, joining not yet confirmed | Edit, discard | HR Executive/Administrator | Active, Discarded | None |
| Active | Joining confirmed | Full module use | All, per scope | On Leave, Suspended, Separation-Initiated | Included in payroll runs |
| On Leave (extended, e.g., sabbatical/maternity) | Manager/HR marks extended leave | Limited edits | HR, self (limited) | Active, Separation-Initiated | Per leave-type payroll rules (Module 6) |
| Suspended | Disciplinary/compliance action | HR-only edit, ESS/MSS access restricted | HR Administrator | Active, Separation-Initiated | Per company policy — flagged as configurable, not assumed |
| Separation-Initiated | Handoff to Module 15 | Governed by Module 15 | HR, Module 15 workflow | Separated (terminal, Module 15) | Governed by Module 15/6 |

A pending Employment Assignment change (§7.2) has its own sub-state (Pending Approval → Approved/Rejected/Returned) independent of the employee's record status above.

## 15. Record detail-page requirements

Per the PRD's own UX instruction (avoid over-tabling, use detail pages): the Employee Detail page is the canonical complex-record page for this whole product. Structure: header (photo, name, designation, department, status badge, primary actions: Edit, Transfer, Initiate Separation — gated by permission); tabbed/sectioned body — Profile (personal/contact/emergency/dependants/nominees), Employment (current + historical Employment Assignments as a timeline, not a flat table), Compensation (Payroll-Executive+ only), Documents (Module 13 link), Assets (Module 14 link), Performance (Module 9 link), Timeline (unified chronological audit view of every change with actor/reason, not per-field logs scattered across tabs). This Timeline view is the direct product realisation of [05](../05-organisation-data-model.md) §7's Employment Assignment audit pattern and should be a first-class tab, not an afterthought.

## 16. Search, filter and sorting requirements

Directory search by name/ID/email/department/designation/location with typeahead; filters: department, location, legal entity, employment type, manager, status; sort by name/joining date/department; server-side pagination required at enterprise scale (per Phase 12 NFRs) — this is one of the highest-traffic list views in the product and must not degrade with thousands of employees.

## 17. Bulk-action requirements

Bulk field update (e.g., holiday-calendar reassignment for a location move affecting many employees) with mandatory preview-before-commit and a single reason_code applied to the whole batch (linking to [05](../05-organisation-data-model.md) §9's "reorg event" batching concept); bulk export (permission- and field-masking-aware); bulk status change (e.g., marking a batch inactive during a migration) requires HR Administrator-level permission given the blast radius. Per [00-existing-system-audit.md](../00-existing-system-audit.md) §6/§10, bulk-select UI must be custom-built on top of the design system's table primitives, which don't include this out of the box.

## 18. Import and export requirements

CSV/Excel import with column-mapping UI, pre-import validation report (not silent partial failure), duplicate detection against government IDs, and a dry-run/preview mode before commit — critical given Cross-Module Workflow #22 (bulk employee import) is explicitly called out as needing careful handling. Export respects field-level permissions/masking (§12) and is itself an auditable, loggable action (bulk-download monitoring, Phase 11).

## 19. Notification requirements

**In-app:** change submitted/approved/rejected, profile-completeness reminder, sensitive-field-change confirmation (bank details, §8 US-3). **Email:** same key events, plus a digest option for HR Administrators (e.g., "12 pending approvals"). **Mobile push:** approval-pending alerts to managers/HR (high-frequency per [04](../04-personas-and-roles.md)'s mobile-priority notes).

## 20. Mobile requirements

Employee: view/edit own self-service-editable fields, view directory, view own timeline (read-only). Manager: view team roster, initiate a transfer/change request (submission only — approval of *others'* changes routes through the Approval Inbox, Module 17/Module 16). Full record editing and bulk actions are desktop-only by design (matches [00](../00-existing-system-audit.md)'s finding that Atlaskit's table/bulk primitives aren't mobile-optimised, and matches Product Principle 10's deliberate mobile scoping).

## 21. Reporting requirements

Headcount by department/location/grade/employment-type; joiners/exits (feeds Module 19's dashboards); profile-completeness rate; probation/confirmation status report; demographic/diversity reports (masked/aggregated per privacy policy — see Phase 11).

## 22. Audit-log requirements

Every Employment Assignment change, every master-data field edit (especially sensitive fields per §12), every status change, every bulk action, every export — actor, timestamp, before/after values, reason_code, approval reference where applicable, per Phase 11's audit-log schema. This module is the primary producer of audit events that Module 19 (Reports) and the Compliance/Audit persona (Module 04, Persona 12) depend on.

## 23. Integration requirements

Downstream: Payroll (Module 6, compensation/statutory data), IT provisioning (Module 22/23, joiner/mover/leaver-triggered), Directory/SSO sync (Module 22). Upstream: Recruitment (Module 8, candidate-to-employee conversion), Onboarding (Module 3). All via the domain events defined in [09-api-and-event-planning.md](../09-api-and-event-planning.md) (`EmployeeCreated`, `EmployeeUpdated`, `EmployeeTransferred`, `EmployeePromoted`).

## 24. Error, empty, and edge cases

**Error states:** duplicate government ID on create/edit (block with clear message + override path for legitimate re-issued-ID cases); attempted edit during a locked payroll period via the standard path (redirect to correction workflow, §7.3); orphaned reporting line if a manager is separated without reassigning reports first (block manager's separation, or require bulk-reassign as part of that separation's checklist — cross-reference Module 15). **Empty states:** new tenant with no employees yet — directory/org-chart should show an explicit "add your first employee" prompt, not a bare empty table. **Edge cases:** employee with no manager (top of hierarchy — CEO/founder) must be a supported, non-error state; employee with multiple simultaneous dotted-line managers and a vacant functional-manager slot during a reorg transition window; rehire of a previously separated employee (see Cross-Module Workflow #17 — must correctly reference/relink historical data, not create a disconnected duplicate record).

## 25. Acceptance criteria

Given an employee's Employment Assignment is changed with a future effective date, when that date arrives, then the change automatically takes effect without manual intervention and all dependent modules (org chart, approval routing) reflect it from that date. Given a query for "who was employee X's manager on date Y," when executed against historical data, then the system returns the correct historical Employment Assignment record without requiring audit-log replay.

## 26. Dependencies

[05-organisation-data-model.md](../05-organisation-data-model.md) (data model this module implements); Module 17 (Workflow Engine, for approvals); Module 21 (Roles and Permissions, for field/record scoping); Module 22 (System Administration, for numbering schemes/custom fields).

## 27. Risks

Retrofitting effective-dating after MVP ships with a simpler current-state-only model would be extremely costly — this is why [05](../05-organisation-data-model.md) treats it as foundational, not deferred. Field-level permission complexity (§12) is easy to under-scope in MVP and hard to retrofit without a data-model change — flagged for early architecture review, not left to "later."

## 28. Open questions

- Carries forward OQ-5 ([04](../04-personas-and-roles.md)): can an employee legally be denied access to certain records about themselves (HR notes, disciplinary history)? Affects this module's field-visibility rules for the Employee persona.
- Is a "Suspended" status's payroll treatment (pay continues / pay withheld / pro-rated) a system default this PRD should propose, or purely tenant-configurable with no default? Recommend tenant-configurable, no opinionated default, given jurisdiction/company-policy variance — flagged for legal review.

## 29. Release scope

**MVP:** full Employee master, Employment Assignment history/effective-dating, directory, org chart (current-state view), transfer/promotion/manager-change workflows, field-level permission masking for compensation/bank/statutory fields, CSV import/export, audit timeline.
**Later phase:** full Position Management (vacant positions, headcount planning — deferred per [03-product-vision.md](../03-product-vision.md) non-goals), historical org-chart time-travel view (view org chart *as of* a past date — valuable but not MVP-critical), advanced custom-form builder beyond simple custom fields.
**Out of scope (indefinitely):** anything resembling a general-purpose CRM or contact-management tool for non-employee contacts (that's not this module's job even though "Nominees"/"Dependants" are adjacent-looking data).
