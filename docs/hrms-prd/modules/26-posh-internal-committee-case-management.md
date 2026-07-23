# Module 26 — POSH / Internal Committee Case Management

**Status:** Draft v1 (pending stakeholder review — **this module requires qualified Indian employment-law counsel review before implementation, more than almost any other module in this PRD alongside Payroll and Separation**) · **Release:** HR Operations
**Depends on:** Module 1 (Core HR), Module 21 (Roles and Permissions — this module's confidentiality requirements are the strictest in the product), Module 17 (Workflow Engine), Module 13 (Documents)
**Added:** 2026-07-23, following a gap-check against actual competitor feature coverage (see [16-product-decision-log.md](../16-product-decision-log.md) D-014) — not part of the original 25-module brief, but identified as a material omission given this product's own India-compliance-first positioning.

---

## 1. Module overview

Case management for the Internal Committee (IC) constituted under the **Prevention of Sexual Harassment of Women at Workplace (POSH) Act, 2013** — complaint intake, IC composition and eligibility tracking, timeline-bound inquiry management, strict confidentiality enforcement, and the statutory annual reporting obligation. This is legally mandated for every employer in India with 10 or more employees, making it a compliance obligation on the same tier as PF/ESI/PT, not an optional engagement feature — a distinct gap this PRD's original 25-module scope did not name explicitly, despite the product's own "compliance-first" positioning.

## 2. Problem statement

None of the eight competitors researched in Phase 2 showed strong, specific, named POSH/IC functionality — Module 11 (Engagement)'s generic anonymous-grievance channel and Module 12 (Helpdesk)'s ticketing system are structurally unsuited to POSH's statutory requirements: a legally-defined committee composition, a strict 90-day inquiry timeline, mandatory confidentiality under Section 16 of the Act (identity of the complainant, respondent, and witnesses may not be published or made known to the public), and an annual report obligation to the District Officer. Treating a POSH complaint as a generic HR ticket or an anonymous survey response would be a genuine compliance failure, not just a UX shortcoming.

## 3. Business objective

Give every tenant a compliant, defensible, appropriately confidential system for constituting an Internal Committee, receiving and processing complaints within the statutory timeline, and producing the required annual statutory report — while keeping this entirely separate, in access and in process, from the product's general HR-case/grievance/helpdesk machinery.

## 4. User personas

This module requires personas beyond the 14 in [04-personas-and-roles.md](../04-personas-and-roles.md), which did not anticipate this module at the time it was written:

- **Complainant** — an employee (or, per the Act, in some cases a non-employee visiting the workplace) filing a complaint. Not a distinct system role so much as any Employee persona using this module's intake path.
- **Respondent** — the employee the complaint is against. Needs to be notified and given an opportunity to respond, per statutory due process, while their identity remains protected from general disclosure per Section 16.
- **Presiding Officer** — per the Act, must be a senior woman employee; chairs the IC.
- **IC Member (internal)** — employees committed to the cause of women, per the Act's composition requirements.
- **IC Member (external)** — per the Act, at least one member must be from an NGO or association familiar with sexual-harassment issues, or otherwise external to the organisation. This maps directly onto [04-personas-and-roles.md](../04-personas-and-roles.md) **Persona 14 (External Consultant/Limited-Access User)** — a time-boxed or standing-but-narrowly-scoped external grant, not a new permission archetype, since that persona was explicitly designed for exactly this kind of narrow, non-employee access need.
- **HR Administrator** — administers IC composition/eligibility records and the annual-reporting process, but critically **does not automatically get case-content access** (§12) — case detail is IC-scoped, not general-HR-scoped, a deliberate and important restriction.

## 5. User needs

A complainant needs a way to file a complaint that they trust will remain confidential and be taken seriously, without it passing through a general HR ticket queue visible to ordinary HR staff. An IC member needs a clear, timeline-aware case workspace that keeps them compliant with the Act's 90-day inquiry window without needing to track deadlines manually. HR Administrator (the tenant's overall compliance owner) needs to know the *aggregate* state of POSH compliance (is the IC properly constituted, is the annual report on track) without needing or wanting access to individual case content.

## 6. Primary use cases

Constitute and maintain Internal Committee composition (with eligibility validation against the Act's requirements); file a complaint (confidential intake, not routed through Module 12); manage the inquiry process (respondent notification, evidence/statement collection, hearing scheduling, timeline tracking); record inquiry findings and recommended action; generate the annual statutory report; track training/awareness-session completion (a statutory obligation distinct from Module 10's general mandatory training, given its specific legal basis).

## 7. Detailed workflows

### 7.1 Complaint intake and confidentiality partitioning

- **Trigger:** An employee (or, per the Act, certain non-employees) wishes to file a complaint.
- **Preconditions:** A validly constituted IC exists for the tenant (§7.2's eligibility check) — if not, the system should surface this as a critical compliance gap to HR Administrator (§21) rather than silently accepting a complaint into a non-compliant process.
- **Actor:** Complainant (files), IC (receives and processes).
- **Steps:** 1) Complainant files via a dedicated, clearly-separated intake path — **never** the general Module 12 helpdesk or Module 11 grievance channel, both of which lack this module's confidentiality guarantees 2) On submission, the case becomes visible **only** to the constituted IC members for that tenant/scope, not to HR Administrator, the complainant's manager, or any other role by default (§12) 3) IC acknowledges receipt and begins the inquiry process (§7.2) 4) Respondent is notified per statutory due-process requirements, with their own identity-protection obligations toward the complainant's confidentiality maintained throughout.
- **Decision points:** A complaint naming a current IC member as respondent must trigger that member's automatic recusal from the case, with the system tracking a reduced-but-still-quorate committee for that specific case (or an ad hoc replacement per the Act's provisions) — this is a real, foreseeable edge case, not a hypothetical.
- **Approval logic:** N/A in the ordinary sense — this is a statutory process, not a business approval chain, though the IC's own findings-and-recommendation step (§7.2) functions similarly to an approval decision within the case's own state machine.
- **System actions:** Case record created with the strictest confidentiality tier in the entire product (§12) — stricter than Module 11's survey-anonymity requirement, since here specific individuals' identities exist and are known to a small, defined set of people (the IC), rather than being structurally unknowable to everyone as in an anonymous survey.
- **Notifications:** Complainant (confidential acknowledgement), IC members (new case), respondent (per statutory due-process timing — not necessarily immediate, per the Act's own procedural requirements, which is a specific detail **flagged for legal review** rather than assumed).
- **Failure handling:** If the IC is not validly constituted at complaint-filing time (§7.2), the system should still accept and confidentially hold the complaint (never refuse or lose it) while flagging the compliance gap urgently to HR Administrator for immediate remediation — the complainant should never be told to come back later.
- **Audit events:** `POSHComplaintFiled`, logged with the same rigor as any audit event but with the underlying case *content* itself subject to the confidentiality restrictions in §12 — the audit log records that an event occurred and by/to whom in the IC's own scope, it does not become a second, less-guarded copy of sensitive case detail visible to general system administrators.

### 7.2 Inquiry timeline management and IC composition eligibility

- **Trigger:** Case received (§7.1), or a scheduled periodic check of IC composition validity.
- **Steps:** 1) System validates current IC composition against the Act's requirements (presiding officer eligibility, minimum internal-member count, at least one external member) — an IC that has lapsed (e.g., an external member's term expired, a presiding officer separated from the company, Cross-Module Workflow #15/#16) is flagged as **non-compliant** immediately, not discovered only when a complaint arrives 2) For an active case, the system tracks the statutory inquiry deadline (recommend a configurable value defaulting to the Act's own timeline, **flagged for legal confirmation of the exact current statutory figure and any tenant-specific extensions**, rather than this PRD asserting a specific number of days as definitively correct in perpetuity) 3) Escalating, IC-visible-only reminders as the deadline approaches 4) IC records findings/recommendation within the case, which HR Administrator then acts on for any resulting employment action (which may itself trigger Module 15's separation workflow, Module 1's disciplinary-adjacent record, etc., depending on the finding) — **the case content and the resulting employment action are deliberately separated**: the IC's inquiry record stays confidentially within this module, while only the *resulting employment decision* (e.g., a termination) flows into the ordinary Module 15 process, without that downstream process needing or receiving the underlying case detail.
- **Decision points:** IC composition lapse (§7.2 step 1) is itself a compliance-critical event, not just an operational inconvenience.
- **Failure handling:** A case that risks breaching the statutory inquiry timeline should escalate urgently to the Presiding Officer, and — per a policy this PRD flags rather than asserts, given the legal sensitivity — potentially to HR Administrator in an aggregate, non-content-revealing way ("a case is at risk of timeline breach" without revealing which case or its content) so the organisation's overall compliance posture remains visible even while individual case confidentiality is preserved.
- **Audit events:** `ICCompositionValidated`/`ICCompositionLapsed`, `POSHInquiryTimelineAtRisk` (aggregate-visibility event, per the failure-handling note above).

## 8. User stories

**US-1**
As a **Complainant**, I want to file a POSH complaint through a channel I know is separate from the general HR helpdesk and visible only to the Internal Committee, so that I trust my complaint will be handled confidentially and appropriately, not routed through ordinary HR ticket processing.
**Acceptance criteria:** Given a complaint is filed through this module, when any user other than a constituted IC member for that case (including HR Administrator and System Administrator) attempts to view its content, then access is denied — this must hold structurally, not merely by convention, mirroring the rigor already established for Module 11's survey-anonymity requirement.

**US-2**
As an **HR Administrator**, I want to know if our Internal Committee has lapsed (e.g., an external member's term ended) before a complaint arrives and exposes the gap, so that I can maintain continuous statutory compliance rather than discovering a failure reactively.
**Acceptance criteria:** Given an IC member's eligibility lapses (term expiry, or separation from the company per Cross-Module Workflow #15/#16), when the system runs its periodic composition check, then HR Administrator is alerted to the compliance gap without needing an active case to trigger the check.

**US-3**
As a **Presiding Officer**, I want the system to track my case's statutory inquiry deadline and warn me as it approaches, so that I don't inadvertently breach the legally mandated timeline through simple oversight.
**Acceptance criteria:** Given a case approaches its configured statutory deadline, when the threshold is crossed, then the Presiding Officer and IC members receive an escalating reminder distinct from and more urgent than this product's ordinary notification cadence (Module 18 §10's critical-notification-override pattern applies here).

## 9. Functional requirements

IC composition management with eligibility validation against statutory requirements (§7.2); confidential complaint intake, structurally separated from Module 11/12 (§7.1); case workspace for IC members (statements, evidence, hearing scheduling, findings, recommendation); statutory inquiry-timeline tracking with escalating reminders; automatic recusal handling for a named-respondent IC member (§7.1); aggregate (non-content-revealing) compliance-posture visibility for HR Administrator (§7.2); annual statutory report generation (case-count and outcome summary at the aggregate level required for filing, never individual case content in a form that could re-identify parties inappropriately); POSH-specific awareness/training-completion tracking (distinct from, though potentially integration-adjacent to, Module 10's general mandatory training).

## 10. Business rules

**This module's confidentiality requirement is the strictest in the entire product** — stricter even than Module 11's survey anonymity (where content is structurally unlinkable to any individual) because here specific real identities exist and must be protected from *disclosure*, not merely kept statistically anonymous; the correct analogy is closer to attorney-client-privilege-style access restriction than to survey anonymisation. Case content is visible only to the constituted IC for that case (with recusal handling per §7.1) — never to HR Administrator, System Administrator, the complainant's or respondent's manager, or any other role, by default, with no configuration option to loosen this (unlike most of this product's other permission boundaries, which are tenant-configurable). Aggregate compliance-posture data (case counts, timeline-risk flags, IC-composition validity) is the *only* thing that may be visible outside the IC, and only in a form that cannot be reverse-engineered to identify a specific case's parties.

## 11. Validation rules

An IC composition cannot be marked valid without at least the Act's minimum required members in each required category (presiding officer, minimum internal members, at least one external member) — **exact current numeric/compositional requirements need direct confirmation against the current text of the Act and any amendments, flagged for legal review rather than hard-coded from this PRD's own understanding**, given how consequential getting this specific detail wrong would be.

## 12. Permission requirements

This module requires its own, narrower permission model layered on top of Module 21's general framework — not a standard role/scope combination, but a **per-case, IC-membership-derived access grant** that is not equivalent to any role's general data scope. Even a System Administrator with full platform access should not have standing access to case content by virtue of that role alone (a deliberate, hard exception to the general permission model, worth stating explicitly since it's such an unusual and important carve-out relative to how every other module in this PRD works).

## 13. Approval workflows

Not a standard Module 17 approval chain — the IC's own findings/recommendation process functions as the case's internal decision point, and any resulting employment action (§7.2) flows through Module 1/15's ordinary approval-gated processes without exposing the underlying case content to those processes.

## 14. Statuses and state transitions

**IC Composition:** Valid → At Risk (a member's eligibility approaching expiry) → Lapsed (§7.2). **Case:** Filed → Under Inquiry → Findings Recorded → Recommendation Issued → Closed (with any resulting employment action tracked separately in Module 1/15, cross-referenced but not content-linked).

## 15. Record detail-page requirements

Case workspace (IC-members-only): timeline, statements/evidence, hearing records, findings, recommendation — structurally inaccessible outside the case's own IC scope, per §12. HR Administrator's own view is limited to the aggregate compliance dashboard (§7.2) — a deliberately different, non-drill-down-capable page, not a permission-filtered version of the same case-detail page other modules would use.

## 16. Search, filter and sorting requirements

IC-member case list: filterable by status/deadline-proximity, scoped entirely to cases that member is (or was, pre-recusal) part of — never a searchable index of all cases across the tenant visible to any single role, including IC members themselves for cases they aren't assigned to.

## 17. Bulk-action requirements

None — the sensitivity of this module's content makes bulk operations of any kind inappropriate; every action is deliberately individual and case-specific.

## 18. Import and export requirements

Annual statutory report export (aggregate, per §9) is the only export this module supports by design — no general case-data export capability, given the confidentiality requirement.

## 19. Notification requirements

**In-app/email:** confidential acknowledgement to complainant, new-case alert to IC members, escalating deadline reminders (§7.1/§8 US-3), IC-composition-lapse alert to HR Administrator (aggregate, not case-specific). No mobile push notification carries case-identifying content in its preview text — a specific, concrete requirement given how easily a phone lock-screen notification preview could leak sensitive information.

## 20. Mobile requirements

Complaint filing should be available on mobile (given how often this may be a sensitive, private moment where a phone is the more comfortable and available device) with the same confidentiality guarantees as web. IC case-workspace access on mobile should be possible for time-sensitive actions but is not the primary design surface, given the depth of case material typically involved.

## 21. Reporting requirements

Aggregate-only: case count and status distribution (for HR Administrator's compliance-posture visibility), IC-composition-validity status, annual-report readiness — **never** individual-case-level reporting outside the IC's own scope, restated here as a reporting-specific instance of §10's central rule.

## 22. Audit-log requirements

Every action within a case is logged within the case's own IC-scoped record; the product-wide audit-log system (per [10-security-privacy-audit.md](../10-security-privacy-audit.md) §13) should record that audit-relevant events occurred (who took what action, when) without those audit entries themselves becoming a second, less-protected copy of case content — a genuinely subtle design requirement worth flagging explicitly rather than assuming the standard audit pattern applies unmodified here.

## 23. Integration requirements

Minimal by design — this module deliberately avoids the general Module 12/Module 11 infrastructure it would otherwise naturally share, specifically because those modules' broader-visibility design is unsuited to this one's confidentiality requirement (§2). Document storage (Module 13) may be used for evidence/statement attachments but with this module's own access restriction applied on top, not Module 13's default document-category visibility rules.

## 24. Error, empty, and edge cases

**Error states:** an IC that lapses mid-case (a member becomes ineligible while a case is active) — needs a defined continuity rule (does the case continue with a reduced-but-still-quorate committee, or must it pause for reconstitution? **flagged for legal review**, not assumed). **Empty states:** a new tenant with no IC constituted yet — should be treated as an urgent, prominent compliance gap in the HR Administrator's onboarding checklist (Module 22's tenant-setup wizard), not a passive, easy-to-overlook empty state, given the legal stakes of operating without one. **Edge cases:** the respondent named in a complaint is also, separately, a member of the IC for an unrelated reason (recusal handling, §7.1); a complaint involving a non-employee (a vendor, client, or visitor), which the Act's coverage may extend to in some circumstances — **flagged for legal confirmation of scope**, not assumed to be either included or excluded by this PRD.

## 25. Acceptance criteria

Given a case is filed and an IC is validly constituted, when any role other than that case's constituted (non-recused) IC members attempts any form of access to the case's content — direct view, report drill-down, export, or API access — then access is denied unconditionally, with no configuration path to override it, this being the one deliberate, hard-coded exception to this PRD's otherwise tenant-configurable permission model.

## 26. Dependencies

Module 1 (employee eligibility data for IC composition), Module 21 (the permission-model exception this module requires), Module 15/1 (downstream employment-action linkage, content-decoupled), Module 13 (evidence storage, with this module's own access override), Module 18 (notification delivery, with the no-content-in-preview requirement).

## 27. Risks

**This module carries acute legal risk if implemented incorrectly** — an IC composition that doesn't meet statutory requirements, a confidentiality breach, or a missed inquiry deadline are not merely product bugs but potential legal violations with real consequences for the tenant company. This module should be treated with at least the review rigor already established for Module 6 (Payroll) and Module 15 (Separation) in this PRD, and arguably more, given the confidentiality-breach risk has no equivalent "off-cycle correction" recovery path — a leaked identity cannot be un-leaked.

## 28. Open questions

- Exact current statutory inquiry timeline and any recent amendments to the Act — **needs direct legal confirmation before this module's timeline defaults are finalised**, not asserted from this PRD's own general understanding.
- Exact IC composition eligibility requirements (numeric minimums, external-member sourcing requirements) — **same, needs legal confirmation**.
- Whether the Act's coverage extends to non-employees (vendors, clients, visitors) in this tenant's specific circumstances, and if so how such a person would be represented in a system built primarily around an Employee-centric data model ([05-organisation-data-model.md](../05-organisation-data-model.md)) — **flagged for legal scoping**, not assumed either way.
- IC continuity rule when composition lapses mid-case (§24) — **flagged for legal review**.

## 29. Release scope

**MVP (recommended, given the compliance-criticality argument for not deferring this to a later release despite being newly added to this PRD):** IC composition management with eligibility validation, confidential complaint intake, case workspace with timeline tracking, aggregate compliance-posture visibility, annual statutory report generation.
**Later phase:** POSH-specific awareness-training-completion tracking depth (beyond a basic completion flag), any AI-assisted capability (explicitly **excluded from Module 25's scope entirely** — this module's content is too sensitive for any AI-assistive capability without dedicated, separate legal and security review specific to this module, not covered by Module 25's general framework).
**Out of scope:** this module does not provide legal advice, does not determine outcomes on the tenant's behalf, and does not replace the tenant's own legal counsel — it is a case-management and compliance-tracking system, not a decision-maker, consistent with this PRD's general AI/automation philosophy applied here to the human IC process itself.
