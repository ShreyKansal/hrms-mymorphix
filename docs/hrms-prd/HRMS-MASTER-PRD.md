# HRMS Master PRD

**Status:** Draft v1 — synthesis of the full `docs/hrms-prd/` document set, pending full stakeholder review (Product, Engineering, Security, Legal/Payroll-compliance) before any implementation planning begins.
**Last updated:** 2026-07-23
**Read this if you only read one document.** Every claim below links to the source document with full detail, evidence, and caveats — this document summarises and synthesises, it does not introduce new claims beyond what those documents establish.

---

## 1. Executive summary

This PRD defines an India-first, enterprise-grade HRMS — benchmarked against Zoho People/Payroll, greytHR, RazorpayX Payroll, Keka, Darwinbox, BambooHR, and Rippling, but not copying any of them — covering the complete employee lifecycle (Recruitment → Preboarding → Onboarding → Employee Management → Attendance → Leave → Payroll → Performance → Engagement → Learning → Compliance → Separation → Alumni), architected as a genuinely unified data model rather than the loosely-synced point-tools pattern found across most competitors researched. It is designed to consume an existing Atlassian-design-system-based UI toolkit rather than introduce a new visual language. **No implementation has occurred** — this is the completed research, planning, and requirements phase.

The single clearest finding from this work: **no competitor researched combines deep, transparent India statutory-compliance, a genuinely unified (not one-way-synced) HR/attendance/leave/payroll data model, modern UX on par with the category's US leaders, and support quality that doesn't degrade under pressure — simultaneously.** Every one of the eight products researched trades at least one of these off. That gap is this product's positioning.

## 2. Product vision

Full detail: [03-product-vision.md](03-product-vision.md).

**Vision:** An HRMS that Indian businesses trust as the single, accurate record of their workforce, where routine HR work happens without friction, every payroll-affecting change is traceable, and the system scales from a 50-person startup to a multi-entity enterprise without changing products.

**Positioning:** "The HRMS that treats India-first statutory compliance as core infrastructure, not a bolted-on module — with a genuinely unified HR–attendance–leave–payroll data model, modern UX, and support that doesn't degrade when you need it most."

**Target market:** Indian businesses of roughly 50–2,000 employees — the underserved middle between payroll-only point tools and enterprise-sales-cycle platforms like Darwinbox. Architecture is multi-country-ready from day one; go-to-market is India-first.

**Ten product principles** (all directly evidenced by competitor research, not asserted generically): single source of truth; minimal manual follow-up; understandable complex workflows; full traceability; least-privilege; managers see only their team; employees self-serve without contacting HR; payroll changes are validated and auditable; usability holds at thousands of employees; mobile is deliberately scoped to high-frequency actions, not full parity.

## 3. Market analysis

Full detail: [01-market-research.md](01-market-research.md), [02-competitor-comparison-matrix.md](02-competitor-comparison-matrix.md), [research-source-register.md](research-source-register.md) (150+ sources, reliability-rated).

Eight products researched in four pairs (Zoho People+Payroll; greytHR+RazorpayX Payroll; Keka+Darwinbox; BambooHR+Rippling). Key cross-cutting findings, each independently corroborated across multiple products:

- **Support-quality complaints are universal** — all 8 products, the single most consistent finding in the entire research set.
- **India statutory-compliance depth is uneven even among India-native competitors** — RazorpayX explicitly excludes LWF filing and has no confirmed gratuity support; greytHR's tier-boundary documentation is internally inconsistent; only Darwinbox shows independently trade-press-corroborated multi-country statutory depth.
- **Mobile/web feature-parity gaps are near-universal** (5 of 8 products) — informing this product's deliberate mobile-scoping decision (D-009) rather than a full-parity chase.
- **One-way or absent HR↔Payroll integration is structural across the market** — Zoho's confirmed one-way sync is the clearest example; no competitor researched has a confirmed genuinely-unified data model.
- **UX quality varies sharply** — BambooHR (G2 4.4/5) and Rippling (G2 4.8/5, highest of all 8) are the clear benchmarks; greytHR ("old-fashioned") and Darwinbox ("basic," "not dynamic") are named laggards.

## 4. Personas

Full detail: [04-personas-and-roles.md](04-personas-and-roles.md) — 14 personas (Employee, People Manager, HR Executive, HR Administrator, Recruiter, Payroll Executive, Payroll Administrator, Finance User, Department Head, Leadership/CXO, IT Administrator, Compliance/Audit User, System Administrator, External Consultant/Limited-Access User), each with goals, pain points, permissions, and mobile/reporting/notification needs.

**Composability is the central design implication:** personas are capability archetypes, not fixed system roles — a real user (especially at a smaller customer) commonly holds several personas' capabilities simultaneously (Module 21 must support this). **Segregation-of-duties pairs** identified as needing explicit design guardrails: Payroll Executive vs. Payroll Administrator; HR Administrator (configure) vs. Compliance/Audit User (audit, read-only); IT/System Administrator (platform access) vs. HR roles (HR-content access).

## 5. Organisation model

Full detail: [05-organisation-data-model.md](05-organisation-data-model.md).

The foundational architectural decision of this entire PRD: **every organisationally-significant relationship is effective-dated**, via an append-only "Employment Assignment" pattern (department, manager, location, grade, designation, payroll group, etc., each with `effective_from`/`effective_to`/`reason_code`/`approval_reference`), never mutated in place. This single pattern is what makes promotion, transfer, manager-change, location-change, and retroactive-correction all realisable as the same underlying mechanism rather than bespoke logic per change type, and what makes "who was this employee's manager on date X" a simple query rather than an audit-log replay. Four independently-assignable dimensions — organisational structure, reporting hierarchy, location, and policy grouping — are deliberately kept separate to support matrix organisations, a common real-world need most rigid single-tree HRMS data models fail to serve well.

## 6. Complete module inventory

All 27 modules specified in full (`modules/01-*.md` through `modules/27-*.md`), each with problem statement, personas, workflows, user stories with Given/When/Then acceptance criteria, business/validation rules, permission requirements, state machines, and explicit MVP/later-phase/out-of-scope boundaries. Modules 1–25 come from the original brief; Modules 26–27 were added after a post-draft gap-check against actual competitor feature coverage (see [16-product-decision-log.md](16-product-decision-log.md) D-014):

1. Core HR and Employee Information System · 2. Organisation Management · 3. Employee Onboarding · 4. Attendance and Time Management · 5. Leave Management · 6. Payroll Management (India-first, amended for contractor/gig payroll, ESOP tax treatment, and statutory registers) · 7. Reimbursements and Expenses · 8. Recruitment and Applicant Tracking · 9. Performance Management · 10. Learning and Development · 11. Employee Engagement · 12. Helpdesk and HR Service Delivery · 13. Documents and Letters · 14. Asset Management · 15. Employee Separation and Offboarding · 16. Employee and Manager Self-Service · 17. Workflow and Approval Engine · 18. Notifications and Communication · 19. Reports and Analytics · 20. Policy and Compliance Management · 21. Roles and Permissions · 22. System Administration · 23. Integrations · 24. Mobile Experience · 25. AI-Assisted Capabilities · **26. POSH / Internal Committee Case Management** (new) · **27. Benefits Administration** (new).

**Highest-risk modules, requiring qualified professional (payroll/legal/security) review before implementation, not just standard QA:** Module 6 (Payroll — statutory correctness, financial/legal exposure), Module 15 (Separation — legal exposure on termination/notice-period disputes), Module 21 (Permissions — cross-cutting security blast radius), Module 25 (AI — bias/fairness risk in recruitment/performance/attrition capabilities), **Module 26 (POSH — legal exposure on IC composition/inquiry-timeline compliance, and the strictest confidentiality requirement in the entire product)**.

**Two gaps identified but deliberately not built as new modules** (logged, not silently dropped): Compensation Management (bands/benchmarking as a discipline distinct from Payroll's processing) and Succession Planning/Skills Taxonomy — assessed as adequately served by existing Module 1/9/10 concepts for now, revisit if customer demand signals otherwise (D-014).

## 7. Cross-module workflows

Full detail: [06-cross-module-workflows.md](06-cross-module-workflows.md) — all 25 required workflows fully specified with Trigger/Preconditions/Actor/Steps/Decision points/Approval logic/System actions/Notifications/Failure handling/Final outcome/Audit events. Two workflows carry **blocking open questions requiring legal input before finalisation**: inter-entity transfer (continuity-of-service treatment, OQ-9) and data deletion/anonymisation (statutory-retention-vs-deletion-request conflict, OQ-23).

## 8. Information architecture

Full detail: [07-information-architecture.md](07-information-architecture.md). 16 primary navigation sections (Home, People, Organisation, Recruitment, Attendance, Leave, Payroll, Expenses, Performance, Learning, Engagement, Helpdesk, Documents, Assets, Reports, Approvals, Administration), all permission-filtered at the navigation level, not just the content level. Consistent list-page/detail-page pattern product-wide, built on the design-system findings from [00-existing-system-audit.md](00-existing-system-audit.md): fixed-wide grid default, `navigation-system` (not the deprecated `side-navigation`), Modal or custom panels (not the deprecated `Drawer`), custom-built bulk-select on top of Atlaskit's table primitives (which lack it natively).

## 9. Permission model

Full detail: [modules/21-roles-permissions.md](modules/21-roles-permissions.md), reinforced in [10-security-privacy-audit.md](10-security-privacy-audit.md). Composable role + scope (self/team/department/location/legal-entity/reporting-hierarchy/custom-population) + time-boxed access, with structural segregation-of-duties blocking (not just documentation) for the highest-risk role combinations, and automatic expiry for temporary/external-consultant grants. **Every module enforces this model at the backend** — frontend restrictions are treated strictly as UX convenience, never the actual security control, per the brief's own explicit framing principle, applied without exception across all 25 modules.

## 10. Integration strategy

Full detail: [modules/23-integrations.md](modules/23-integrations.md). A consistent framework (purpose/data-flow-direction/data-ownership/auth/sync-frequency/field-mapping/failure-handling/duplicate-handling/retry-strategy/monitoring/audit/manual-resync) applied to every integration type: biometric/attendance devices, identity providers (Entra ID, Google Workspace, M365, Okta), Slack/Teams, banking (payroll disbursal), accounting/ERP, job boards, background-verification, e-signature, LMS, benefits platforms, plus generic REST/webhook/SFTP infrastructure. This product is architected as the authoritative source of truth for HR/employee data, with external systems treated as consumers, not co-equal sources — a deliberate contrast to the one-way-sync ambiguity found against Zoho in market research.

## 11. Security strategy

Full detail: [10-security-privacy-audit.md](10-security-privacy-audit.md). Absolute, structural multi-tenant isolation as the single highest-priority requirement; field-level sensitive-data masking (compensation, bank, statutory IDs, performance ratings, HR case notes) applied identically whether data is viewed directly, via a report, or exported; bulk-download and privileged-access monitoring as named, specific requirements (not generic logging); immutable audit records with a full standard schema (actor/timestamp/tenant/action/entity/before-after/reason/approval-reference/correlation-ID); legal-hold hard-precedence over normal data-retention/deletion. **Needs qualified security and legal/privacy professional review before implementation** — this document sets requirements, it does not substitute for that review.

## 12. Non-functional requirements

Full detail: [11-non-functional-requirements.md](11-non-functional-requirements.md) — all numeric targets explicitly labelled initial assumptions pending stakeholder validation (99.9% core-module availability, ≤2s list-page performance at 95th percentile up to 10K employees, ≤1hr RPO/≤4hr RTO, WCAG 2.2 AA accessibility target). Architecture must support growth from a 50-person MVP customer to a 10,000+-employee enterprise customer on the same product — directly contrasting the "outgrow it" ceiling found against BambooHR and Darwinbox in competitor research.

## 13. Reporting strategy

Full detail: [modules/19-reports-analytics.md](modules/19-reports-analytics.md) (the engine) and [12-report-catalogue.md](12-report-catalogue.md) (the content — 30+ named reports across headcount, attendance, leave, payroll, recruitment, performance, engagement, compliance, and audit domains, each mapped to intended personas with sensitivity flags). Permission enforcement holds identically at every level — direct record access, report view, and drill-down — never a reporting "back door" around the Module 21 permission model. Eight persona-specific dashboards (Employee, Manager, HR Operations, Payroll, Recruitment, Finance, Leadership, System Administration).

## 14. MVP scope

Full detail: [13-release-roadmap.md](13-release-roadmap.md). MVP is the **Foundation + HR Operations + Payroll Releases**: core employee records with effective-dating, roles/permissions, workflow engine, onboarding, attendance, leave, ESS/MSS, payroll with full India statutory compliance (PF/ESI/PT/LWF/TDS/gratuity), reimbursements, and mobile support for check-in/leave/approvals/payslip-view. Recruitment, Performance, Learning, and Engagement follow in the Talent Release; Position Management, advanced reporting, deep integrations, and staggered AI capabilities follow in the Enterprise Release.

## 15. Product roadmap

Full detail: [13-release-roadmap.md](13-release-roadmap.md). **Foundation → HR Operations → Payroll → Talent → Enterprise**, deliberately not calendar-dated — the Payroll Release specifically carries a hard quality gate (qualified payroll-professional sign-off on statutory correctness) rather than a date-driven ship decision, given the financial/legal stakes documented throughout Module 6.

## 16. Success metrics

Full detail: [14-success-metrics.md](14-success-metrics.md), across product, operational, compliance, UX, business, and technical categories. The single most differentiating metric in the whole set: **support-response SLA adherence during the customer's own payroll-close window specifically** — directly targeting the one weakness every competitor researched shares.

## 17. Risk summary

Full detail: [15-risk-register.md](15-risk-register.md), 24 risks scored by probability × impact. **Critical-tier risks:** incorrect payroll calculation (R1), permission misconfiguration (R4), cross-tenant data leakage (R5), general employee-data exposure (R6), payroll rollback failures / rollback-terminology honesty (R14), **POSH case confidentiality breach (R23, added with Module 26)** — the last of these is distinctive in having no off-cycle-correction-style recovery path at all, unlike every other critical risk in this register. Every critical-tier risk maps to an explicit mitigation already designed into the relevant module PRD, not left as an unaddressed gap — but each also carries a hard implementation-phase gate (qualified professional review, dedicated security testing) that this PRD phase cannot itself satisfy.

## 18. Open questions

The full, complete list lives across each document's own "Open Questions" section; the ones with the broadest cross-document impact:

- **OQ-1:** Is direct use of public `@atlaskit/*` npm packages the intended integration path, given some referenced design-system resources are marked "Atlassians only"? ([00-existing-system-audit.md](00-existing-system-audit.md))
- **OQ-2:** Native app vs. responsive web for mobile — materially affects Module 24's offline-capability feasibility. ([00-existing-system-audit.md](00-existing-system-audit.md), [modules/24-mobile-experience.md](modules/24-mobile-experience.md))
- **OQ-9:** Inter-entity-transfer continuity-of-service treatment (PF/gratuity carry-over) — **blocking**, needs qualified legal/payroll input. ([05-organisation-data-model.md](05-organisation-data-model.md), Cross-Module Workflow #4)
- **OQ-18:** Is a specific near-term expansion country known (affecting how much GCC/SEA-specific metadata modelling is worth prioritising early)? ([03-product-vision.md](03-product-vision.md))
- **OQ-19:** Real product name, replacing the "Project Meridian" placeholder. ([03-product-vision.md](03-product-vision.md))
- **OQ-20:** Commercial/pricing model — affects several success-metrics targets that can't be finalised without it. ([03-product-vision.md](03-product-vision.md), [14-success-metrics.md](14-success-metrics.md))
- **OQ-23:** Exact technical boundary between "must delete," "must anonymise," and "must retain despite a deletion request" — needs dedicated legal review. ([06-cross-module-workflows.md](06-cross-module-workflows.md) Workflow #25)
- **OQ-28:** REST vs. GraphQL vs. hybrid API architecture — flagged for formal architecture-team ratification. ([09-api-and-event-planning.md](09-api-and-event-planning.md))

## 19. Appendix and document links

Full index, reading order, and status tracking: [README.md](README.md). Complete document set:

**Foundation:** [00-existing-system-audit.md](00-existing-system-audit.md) · [01-market-research.md](01-market-research.md) · [02-competitor-comparison-matrix.md](02-competitor-comparison-matrix.md) · [research-source-register.md](research-source-register.md) · [03-product-vision.md](03-product-vision.md) · [04-personas-and-roles.md](04-personas-and-roles.md) · [05-organisation-data-model.md](05-organisation-data-model.md)

**Modules:** [modules/](modules/) — 25 files, `01-core-hr-employee-information.md` through `25-ai-assisted-capabilities.md`

**Cross-cutting:** [06-cross-module-workflows.md](06-cross-module-workflows.md) · [07-information-architecture.md](07-information-architecture.md) · [08-conceptual-data-model.md](08-conceptual-data-model.md) · [09-api-and-event-planning.md](09-api-and-event-planning.md) · [10-security-privacy-audit.md](10-security-privacy-audit.md) · [11-non-functional-requirements.md](11-non-functional-requirements.md) · [12-report-catalogue.md](12-report-catalogue.md)

**Planning:** [13-release-roadmap.md](13-release-roadmap.md) · [14-success-metrics.md](14-success-metrics.md) · [15-risk-register.md](15-risk-register.md) · [16-product-decision-log.md](16-product-decision-log.md)

---

## Final quality-check confirmation

Per the brief's own final-quality-check requirements: every employee lifecycle stage is covered (§6 module inventory spans Recruitment through Alumni); every module contains workflows and Given/When/Then acceptance criteria (verified per-module in `modules/`); permissions are defined for every sensitive action (Module 21, reinforced per-module); payroll-affecting events are traceable (the Employment Assignment/Compensation pattern, §5, plus [09-api-and-event-planning.md](09-api-and-event-planning.md)'s domain-event table); effective-dated changes and historical-record preservation are addressed as foundational, not incidental (§5); audit requirements are defined product-wide ([10-security-privacy-audit.md](10-security-privacy-audit.md) §13); multi-tenant isolation is addressed as the top security priority ([10-security-privacy-audit.md](10-security-privacy-audit.md) §1); mobile workflows are scoped deliberately, not omitted (Module 24); reports are mapped to personas ([12-report-catalogue.md](12-report-catalogue.md)); imports/exports/integrations are covered per-module and centrally (Module 22, Module 23); empty/error/edge cases are documented per-module (§24 of every module PRD); MVP and later-phase scope are explicitly separated everywhere (§29 of every module PRD, consolidated in [13-release-roadmap.md](13-release-roadmap.md)); assumptions and open questions are visible throughout, never silently invented; **no development has started**.
