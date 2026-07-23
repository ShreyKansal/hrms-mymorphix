# Module 22 — System Administration

**Status:** Draft v1 (pending stakeholder review) · **Release:** Foundation
**Depends on:** [05-organisation-data-model.md](../05-organisation-data-model.md), Module 21 (Roles and Permissions)

---

## 1. Module overview

Tenant/organisation setup, branding, authentication settings (SSO/MFA/password/session policy), custom fields/forms, numbering schemes, calendars (financial/leave/payroll year, holiday), feature flags, sandbox environment, data import/export/migration, backup, and subscription/usage management. This is the module that turns a generic multi-tenant product into *this specific tenant's* configured instance.

## 2. Problem statement

Phase 2 research repeatedly found that routine configuration changes at several competitors required vendor support tickets or engineering-adjacent scripting (Zoho's Deluge for advanced automation, RazorpayX's rigid workflows) — this module is this product's answer: the tenant-configuration surface should be genuinely self-serve for the customer's own administrators, not a hidden vendor-support dependency.

## 3. Business objective

Let a new tenant go from signup to a working, correctly-configured instance (org structure, policies, numbering, calendars, SSO) without vendor engineering involvement for the common case, while giving System Administrators the platform-level controls (sandbox, feature flags, data migration, backup/DR) that a serious enterprise deployment needs.

## 4. User personas

Primary: **System Administrator** (platform/tenant configuration), **IT Administrator** (SSO/MFA/security settings, per [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 11's scoped access). Secondary: **HR Administrator** (numbering schemes, custom fields, calendars — configuration that's HR-domain-relevant even if technically adjacent to "system" administration).

## 5. User needs

System Administrator needs initial tenant setup to be guided and progressive (per [05-organisation-data-model.md](../05-organisation-data-model.md) §2's progressive-disclosure principle — a simple single-entity SMB shouldn't face the same setup complexity as a multi-entity enterprise). IT Administrator needs SSO/MFA/security configuration without needing broader HR-content access to configure it (the same least-privilege principle established in Module 21 §9). Both need a safe way to test configuration changes (sandbox) before they affect production data.

## 6. Primary use cases

Initial tenant/organisation setup; branding and domain configuration; email configuration; SSO/MFA/password-policy/IP-restriction/session-management configuration; API key and webhook management; custom field/form definition; numbering-scheme configuration (Employee ID, requisition ID, etc.); financial/leave/payroll year and holiday-calendar configuration; feature-flag management; sandbox environment management; data import/export/migration; backup/DR configuration and testing; audit-log access (platform-level); usage-limit and subscription management.

## 7. Detailed workflows

### 7.1 Tenant onboarding (initial setup)

- **Trigger:** New tenant signs up / is provisioned.
- **Steps:** 1) Guided setup wizard: organisation name, primary legal entity, default location, financial/leave year start, default holiday calendar 2) First System Administrator account created (the bootstrapping edge case flagged in Module 21 §24 — this workflow *is* the answer: initial account creation happens as part of tenant provisioning itself, outside the normal role-assignment flow, since no one exists yet to grant that first role) 3) Optional: import existing employee data (Module 1 §18's bulk-import capability, surfaced here as part of onboarding) 4) Optional: configure SSO if the tenant has an existing identity provider 5) Tenant is marked "Active" and normal operation begins — additional entities/departments/policies can be added progressively rather than being forced up front (§5).
- **Audit events:** `TenantProvisioned`, `InitialAdministratorCreated`.

### 7.2 Sandbox-to-production configuration promotion

- **Trigger:** A System/HR Administrator wants to test a significant configuration change (e.g., a new workflow, Module 17 §7.2's simulation capability at a broader system-configuration level; a new custom field affecting many forms) before applying it live.
- **Steps:** 1) Administrator makes the change in the sandbox environment (a data-isolated copy of the tenant's configuration, not real employee data by default, to avoid the sandbox itself becoming a compliance/privacy exposure) 2) Change is tested/validated in sandbox 3) Administrator promotes the specific configuration change to production via an explicit, reviewable action — not an automatic sync, given the risk of an untested sandbox artifact accidentally reaching production.
- **Audit events:** `SandboxChangePromoted`, with a clear record of what specifically was promoted.

## 8. User stories

**US-1**
As a **System Administrator** setting up a new 50-person company, I want to complete initial setup in one guided flow without needing to understand multi-entity/business-unit concepts I don't need yet, so that I'm productive quickly — directly implementing the progressive-disclosure principle from [05-organisation-data-model.md](../05-organisation-data-model.md) §2.
**Acceptance criteria:** Given a new tenant with no prior configuration, when the setup wizard completes with just organisation/entity/location/calendar basics, then the tenant is fully operational for core HR/attendance/leave use without any blocking prompt to configure business units, cost centres, or multi-entity structure they don't need.

**US-2**
As an **IT Administrator**, I want to configure SSO and MFA policy without needing access to employee compensation or performance data, so that my access matches my actual job responsibility — directly implementing [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 11's least-privilege principle, concretely, in this module's own permission design.
**Acceptance criteria:** Given the IT Administrator role is granted only system-configuration capabilities (per Module 21), when they access this module's SSO/MFA configuration pages, then they have full functional access there while remaining blocked from HR-content data elsewhere in the product.

## 9. Functional requirements

Tenant/organisation setup wizard (§7.1); branding (logo, colour accents within the design-system's token constraints per [00-existing-system-audit.md](../00-existing-system-audit.md) §4 — branding customisation should work *through* the design token system, not bypass it with arbitrary CSS, to preserve the design system's consistency guarantees); domain configuration; email configuration (sending domain, templates overlap with Module 18); authentication settings: SSO (SAML/OIDC), MFA, password policies, IP restrictions, session management/timeout; API keys and webhooks (feeding Module 23's integration needs); custom fields and custom forms (with a defined lifecycle — deprecating a custom field shouldn't break existing records/reports referencing it, per Module 17 §24's related edge case); numbering schemes (Employee ID, requisition ID, ticket ID, etc. — configurable format, not hard-coded); financial year, leave year, payroll year configuration (potentially all different from each other, per [05-organisation-data-model.md](../05-organisation-data-model.md)); holiday calendars (location-aware, per Module 4 §9); feature flags (for gradual rollout/beta features); sandbox environment (§7.2); data import (Module 1 §18 and others' equivalents, centrally coordinated here); data export; data migration tooling (for onboarding a customer moving from a competitor product — directly relevant given [03-product-vision.md](../03-product-vision.md)'s competitive-displacement positioning); backup strategy and DR testing; audit logs (platform-level view, complementing each module's own); data-retention settings (working with Module 20's retention-policy authoring); system health monitoring; usage limits; subscription management.

## 10. Business rules

Sandbox environments should not contain real employee PII by default (a synthetic/anonymised dataset, or an explicit, logged opt-in if a customer genuinely needs to test against real data) — a deliberate privacy-by-design constraint given how easily a "just for testing" environment becomes an under-governed data-exposure risk in practice.

## 11. Validation rules

A numbering-scheme change should not retroactively renumber existing records — new scheme applies to new records only, existing IDs remain stable (consistent with this PRD's general "never silently mutate historical records" philosophy).

## 12. Permission requirements

This module is the clearest test case for Module 21's IT-Administrator-vs-HR-content separation principle (§8 US-2) — every sub-area of this module (SSO/security vs. HR-domain configuration like numbering/calendars) should be independently grantable, not bundled into one monolithic "System Administrator" permission.

## 13. Approval workflows

Major configuration changes (e.g., SSO provider change, feature-flag rollout affecting many users) may warrant a second-approver requirement (Module 17) given the blast radius, tenant-configurable rather than mandatory for every change.

## 14. Statuses and state transitions

**Tenant:** Provisioning → Active → Suspended (e.g., billing issue) → Deprovisioned. **Sandbox change:** Draft → Tested → Promoted/Discarded (§7.2).

## 15. Record detail-page requirements

Tenant configuration is naturally organised as a settings area with clear sections (Organisation, Authentication, Data, Sandbox, Billing) rather than one undifferentiated settings page — see [07-information-architecture.md](../07-information-architecture.md) for placement within the overall navigation.

## 16. Search, filter and sorting requirements

Settings search (finding a specific configuration option quickly, given how many settings a mature system accumulates) is a genuine usability need worth calling out explicitly, not assumed automatic.

## 17. Bulk-action requirements

Bulk custom-field application across forms; bulk data import (§9) is this module's primary bulk-action surface.

## 18. Import and export requirements

This module *is* the central coordination point for import/export/migration across the product (§9) — individual modules' own import/export capabilities (Module 1 §18, Module 4 §18, etc.) are specific instances of this module's broader data-migration infrastructure.

## 19. Notification requirements

**In-app/email:** configuration changes affecting many users (feature-flag rollout, SSO change) notified to relevant administrators; backup/DR test results; usage-limit-approaching alerts; sandbox-promotion confirmations.

## 20. Mobile requirements

Low priority — this is a desktop-oriented configuration module by nature, consistent with every other high-blast-radius administrative module in this PRD.

## 21. Reporting requirements

System health, usage/subscription reports, tenant-provisioning audit trail, data-migration success/error reports.

## 22. Audit-log requirements

Every configuration change across every sub-area of this module — per Phase 11, with SSO/security-setting changes and sandbox-promotion events warranting particular attention given their security relevance.

## 23. Integration requirements

Module 23 (this module configures the API keys/webhooks that Module 23's integrations use); Module 21 (permission enforcement for this module's own access); every module's import/export capability routes through this module's central data-migration infrastructure.

## 24. Error, empty, and edge cases

**Error states:** SSO misconfiguration locking out administrators (needs a documented break-glass recovery path — a genuinely important edge case for any SSO-dependent system, flagged explicitly rather than assumed away). **Empty states:** brand-new tenant mid-setup-wizard (§7.1 — the wizard itself is the empty-state handling). **Edge cases:** a numbering-scheme change while records using the old scheme are still being actively created (mid-flight ID-generation edge case, needs careful handling to avoid collision).

## 25. Acceptance criteria

Given a break-glass SSO-recovery mechanism exists, when an SSO misconfiguration locks out all administrators, then a documented, secure recovery path (e.g., a super-admin credential outside the SSO flow, tightly controlled) allows regaining access without a full support/vendor-intervention dependency.

## 26. Dependencies

[05-organisation-data-model.md](../05-organisation-data-model.md), Module 21, Module 23.

## 27. Risks

SSO break-glass recovery (§24/§25) is a specific, easy-to-overlook-until-it-happens risk — worth explicit design attention now rather than discovering the gap during a real lockout incident.

## 28. Open questions

None significant beyond what's flagged inline.

## 29. Release scope

**MVP:** tenant setup wizard, org/entity/location/calendar configuration, SSO/MFA/password/session settings, custom fields, numbering schemes, basic data import/export, audit logs.
**Later phase:** full sandbox environment (§7.2), feature-flag management, advanced data-migration tooling (for competitor-displacement onboarding), usage/subscription self-service management.
**Out of scope:** this module does not include billing/payment processing itself (that's a separate commercial-operations system this PRD doesn't specify) — it manages usage/subscription *visibility and limits*, not the underlying payment infrastructure.
