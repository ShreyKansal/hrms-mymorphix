# Module 21 — Roles and Permissions

**Status:** Draft v1 (pending stakeholder review) · **Release:** Foundation
**Depends on:** [04-personas-and-roles.md](../04-personas-and-roles.md), [05-organisation-data-model.md](../05-organisation-data-model.md)

---

## 1. Module overview

The granular, role-based **and** scope-based access-control system every other module enforces against. Per [00-existing-system-audit.md](../00-existing-system-audit.md)'s explicit framing principle (frontend restrictions are UX, not security — all permissions must be enforced on the backend), this module is the backend authority; every module's UI merely reflects what this module allows, never substitutes for it.

## 2. Problem statement

Phase 2 research found permission-model sophistication to vary widely: Rippling's "Supergroups" (dynamic, attribute-driven, extending into third-party app permissions) is the most architecturally advanced model found; most others are simpler role+hierarchy models. [04-personas-and-roles.md](../04-personas-and-roles.md)'s 14-persona analysis surfaced specific, recurring needs (segregation of duties, least-privilege for IT/System Administrators regarding HR content, time-boxed external-consultant access) that a simple fixed-role model cannot satisfy — over-provisioning external/limited-access users because the product only offers coarse roles is a named, real-world failure mode (Persona 14).

## 3. Business objective

Give every tenant a permission model expressive enough to implement least-privilege and segregation-of-duties precisely (per [04-personas-and-roles.md](../04-personas-and-roles.md)'s cross-persona notes) without requiring a new "role" to be invented for every combination of needs — via composable capability grants across role, scope, and time, not a single fixed role-per-user model.

## 4. User personas

Primary: **System Administrator** (platform-level role/permission architecture), **HR Administrator** (delegated role administration within their scope, per [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 4). Every persona in the system is a permission *subject*; this module doesn't have its own narrow user base beyond the administrators who configure it.

## 5. User needs

Administrators need to grant exactly the access a role needs — no more — without the friction of a purely bespoke, per-user configuration for common cases. Every user needs confidence that the system genuinely enforces boundaries (e.g., a Payroll Executive genuinely cannot process/lock a run, not just have that button hidden in the UI).

## 6. Primary use cases

Define system and custom roles; assign module/action/field/record-level permissions to a role; scope a role's data access (self/team/department/location/legal-entity/reporting-hierarchy/custom population); grant temporary/delegated/time-boxed access; configure sensitive-information and payroll-specific access tiers; review audit/access-review reports; manage impersonation controls (for support purposes); review permission-change history.

## 7. Detailed workflows

### 7.1 Role and scope assignment

- **Trigger:** A new user needs system access, or an existing user's access needs to change (role change, transfer, temporary grant).
- **Steps:** 1) Administrator selects one or more roles for the user (composable — a user can hold multiple capability sets simultaneously, per [04-personas-and-roles.md](../04-personas-and-roles.md)'s "composability, not exclusivity" cross-persona note, e.g., a 50-person company's one HR person holding HR Executive + Payroll Executive + Recruiter capabilities) 2) For each role, administrator confirms or overrides the default data scope (self/team/department/location/legal-entity/reporting-hierarchy-derived/custom population — the scope dimensions from [05-organisation-data-model.md](../05-organisation-data-model.md) §10) 3) For a temporary/external-consultant grant (Persona 14), administrator sets an explicit start and end date 4) System validates the resulting effective permission set doesn't violate a configured segregation-of-duties rule (e.g., a role combination that would let one person both prepare and approve payroll without a defined dual-control exception) — **this is a genuine automated guardrail, not just documentation**, given how easily segregation-of-duties can be silently violated through careless role combination.
- **Decision points:** Segregation-of-duties conflict detected → block or require an explicit, logged override-with-justification (tenant-configurable which, but defaulting toward block for the highest-risk combinations like Payroll Executive+Administrator on the same person).
- **System actions:** On a time-boxed grant's end date, access is automatically and verifiably revoked (Persona 14's specific acceptance-criteria requirement) — not dependent on someone remembering to revoke it manually.
- **Audit events:** `RoleAssigned`, `PermissionScopeChanged`, `TemporaryAccessGranted`/`TemporaryAccessExpired` — every one of these is itself a high-sensitivity audit event given permission changes are effectively privilege-escalation-relevant.

### 7.2 Access review

- **Trigger:** Scheduled (e.g., quarterly) or ad hoc compliance-driven access review.
- **Steps:** 1) System generates a report of every active role/scope/temporary-grant assignment, highlighting: grants nearing expiry, grants that have been extended multiple times (a pattern worth scrutiny — "temporary" access that's become de facto permanent), and any currently-active segregation-of-duties override 2) Reviewer (typically HR Administrator, System Administrator, or Compliance/Audit User) confirms or revokes each flagged item.
- **Audit events:** `AccessReviewCompleted`, with the specific decisions made per flagged item retained.

## 8. User stories

**US-1**
As a **System Administrator**, I want to grant a contract recruiter access scoped to exactly one active requisition's candidate pipeline, with an automatic expiry at the engagement's end date, so that I don't have to remember to revoke access manually and don't have to over-provision them with a generic "Recruiter" role's full org-wide access.
**Acceptance criteria:** Given a temporary-access grant is created with a defined end date and a custom population scope (one requisition), when that end date passes, then access is automatically revoked and this is logged, without requiring manual action.

**US-2**
As an **HR Administrator**, I want the system to warn me if I'm about to assign both Payroll Executive and Payroll Administrator capabilities to the same person, so that I don't accidentally undermine the dual-control design Module 6 depends on.
**Acceptance criteria:** Given a role assignment would result in one user holding both Payroll-prepare and Payroll-approve capabilities, when the administrator attempts to save, then the system blocks by default and requires an explicit, logged override with justification to proceed.

**US-3**
As an **IT Administrator**, I want my role to grant system/integration configuration access without granting general HR-content (compensation, performance, personal-details) visibility, so that I have exactly the access my job needs — directly implementing [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 11's explicit least-privilege design principle.
**Acceptance criteria:** Given the IT Administrator role is assigned with only system-configuration capabilities, when that user attempts to browse the employee directory's compensation fields, then access is denied at the backend regardless of any UI navigation path that might otherwise reach that data.

## 9. Functional requirements

System roles (pre-defined, matching the 14 personas in [04-personas-and-roles.md](../04-personas-and-roles.md) as a starting capability-set library, not a rigid final list); custom roles (tenant-defined, composed from the same underlying capability primitives); module-level and action-level permissions (View, Create, Edit, Delete, Approve, Export, Import, Download, Share, Configure, Process, Lock, Unlock, Override — per the brief's explicit action list); field-level permissions (per Module 1 §12's compensation/bank/statutory-field masking as the flagship example); record-level permissions; scope types: self, team (direct/dotted-line reports), department, location, legal-entity, reporting-hierarchy-derived, custom population (arbitrary saved employee segment, for cases like Persona 14's narrow grants); temporary/time-boxed access with automatic expiry (§7.1); delegated access (distinct from Module 17's approval-delegation — this is broader data-access delegation, e.g., an HR Administrator covering for a colleague on leave); sensitive-information access tiers (compensation, statutory IDs, bank details, performance ratings, HR case notes); payroll-specific access controls (Module 6 §12's segregation-of-duties requirement, enforced here); audit access (Compliance/Audit User's broad-read/zero-write pattern, per [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 12); impersonation controls (for legitimate support purposes — must be itself tightly logged and consent/notice-aware, not a silent backdoor); permission-change audit trail (§7.1's events); access-review reports (§7.2).

## 10. Business rules

Segregation-of-duties conflicts (Payroll Executive+Administrator; HR Administrator configuring+Compliance/Audit User auditing the same scope; IT/System Administrator holding general HR-content access) default to blocked, with a logged override path for genuine exceptions — never silently allowed (§7.1/US-2). Temporary access grants always have a defined end date — there is no "temporary" grant type without an expiry, structurally (US-1). Impersonation (support access) always requires a logged reason and, at minimum, is visible to the impersonated user after the fact (transparency, not a silent capability) — exact real-time-notice-vs-after-the-fact policy is tenant-configurable, but silent-and-invisible impersonation is not an option this module offers.

## 11. Validation rules

A role cannot be saved with a scope configuration that resolves to zero valid data (e.g., a "department" scope referencing a deactivated department) without a clear warning — mirrors Module 17 §11's workflow-validation pattern, applied here to permission scoping.

## 12. Permission requirements

Meta: permission *configuration* itself (creating/editing roles, assigning scopes) is System-Administrator/HR-Administrator tier (per [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 4/13) — and, notably, this configuration capability should itself be a distinctly grantable permission, not bundled automatically with any broad "Administrator" label, avoiding the same over-bundling risk called out for IT Administrator in §9.

## 13. Approval workflows

Segregation-of-duties overrides require a logged justification at minimum (§10); some tenants may configure a second-approver requirement for the highest-risk overrides (e.g., granting Payroll dual-control override) via Module 17.

## 14. Statuses and state transitions

**Role assignment:** Active → Expired (temporary grants, automatic) → Revoked (manual). **Access-review flag:** Flagged → Confirmed/Revoked (§7.2).

## 15. Record detail-page requirements

Role management page: capability matrix (module × action × field/record scope), assigned users, version/change history. User's effective-permissions view (a genuinely useful diagnostic page showing, for a specific user, the *combined* effect of every role/scope they hold — critical for troubleshooting "why can't this user see X," a common real-world support need that a purely role-by-role view doesn't answer well).

## 16. Search, filter and sorting requirements

Role/permission library searchable by module/capability; user-permission lookup searchable by user name (for the effective-permissions diagnostic view, §15).

## 17. Bulk-action requirements

Bulk role reassignment (e.g., after a reorg changes many users' appropriate scope, linking to [05-organisation-data-model.md](../05-organisation-data-model.md) §9's reorg-event batching); bulk access review action (§7.2, confirming/revoking multiple flagged grants at once where genuinely appropriate, though this needs the same care as any bulk high-blast-radius action).

## 18. Import and export requirements

Role-definition export/import (sandbox/production or multi-org portability, same pattern as Module 17/19); access-review-report export for compliance purposes.

## 19. Notification requirements

**In-app/email:** role/scope changed (to the affected user and to the granting administrator, for mutual transparency), temporary-access-expiry-approaching (to the granting administrator, per Persona 14's acceptance criteria — giving them a chance to extend deliberately or let it lapse), segregation-of-duties-override applied (to a designated compliance contact, for visibility).

## 20. Mobile requirements

Low priority — this is a desktop-oriented, careful-configuration task by design (consistent with the "high-blast-radius actions shouldn't be made easier to do accidentally from a phone" principle established for Module 6/15).

## 21. Reporting requirements

Access-review reports (§7.2), permission-change-history report, active-temporary-grants report (with ageing/extension-count visibility, per §7.2), segregation-of-duties-override report.

## 22. Audit-log requirements

Every role/scope assignment and change, every temporary grant creation/expiry/revocation, every segregation-of-duties override, every impersonation session — per Phase 11; this module's audit trail is foundational to nearly every other module's own security posture, since a permission-model breach or misconfiguration potentially compromises everything downstream.

## 23. Integration requirements

Enforced by every other module (all 24 others) — this module has no significant external integration requirements of its own beyond potentially SSO/identity-provider role-mapping (Module 22/23, for organisations wanting their IdP groups to drive HRMS role assignment).

## 24. Error, empty, and edge cases

**Error states:** a user with zero effective roles/scope attempting to log in (should be a clear, actionable "no access configured, contact your administrator" state, not a confusing blank/broken experience). **Empty states:** a new tenant's very first System Administrator account (a genuine bootstrapping edge case — who grants the first grantor's access? Needs an explicit, documented tenant-provisioning flow, flagged for Module 22). **Edge cases:** a user holding a role whose underlying capability set changes (e.g., a system-role definition update) — should the change apply retroactively to everyone holding that role, or only to new assignments? Recommend immediate application for system-role updates (unlike Module 17's workflow-versioning in-flight-isolation principle, since a permission *reduction* especially should apply immediately for security reasons, while a permission *increase* is lower-risk either way) — flagged as an explicit, non-obvious design decision worth stating rather than leaving ambiguous.

## 25. Acceptance criteria

Given a user's role is changed to remove a capability, when they attempt an action requiring that capability (via any path — UI, API, or otherwise), then it is blocked immediately, not just hidden from the UI they'd normally use to reach it — directly implementing the brief's own "frontend restrictions are UX, backend is security" principle.

## 26. Dependencies

[04-personas-and-roles.md](../04-personas-and-roles.md), [05-organisation-data-model.md](../05-organisation-data-model.md); enforced by every other module.

## 27. Risks

This is the single module whose design flaws have the highest potential blast radius in the entire product — a permission-model gap doesn't just break one feature, it potentially exposes sensitive data across every module simultaneously. Warrants the highest security-review priority of any module in this PRD, alongside Module 6.

## 28. Open questions

The exact default segregation-of-duties conflict list (§10) beyond the Payroll and IT/HR-content examples given — needs a dedicated design pass enumerating every genuinely risky role combination, ideally with security/compliance stakeholder input, not assumed complete from this PRD phase alone.

## 29. Release scope

**MVP:** system + custom roles, module/action/field/record-level permissions, all scope types, temporary access with auto-expiry, basic segregation-of-duties blocking (Payroll, IT/HR-content), audit trail, effective-permissions diagnostic view.
**Later phase:** SSO/IdP-group-driven role mapping (Module 23 tie-in), advanced access-review automation, impersonation-controls refinement.
**Out of scope:** this module does not implement a general-purpose identity-and-access-management (IAM) product for non-HRMS systems — it's scoped to this product's own permission needs, though it should integrate cleanly with a tenant's existing enterprise IAM/SSO (Module 22/23) rather than trying to replace it.
