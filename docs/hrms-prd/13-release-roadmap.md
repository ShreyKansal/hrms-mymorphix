# 13 — MVP and Release Planning

**Status:** Draft v1 (pending stakeholder review)
**Last updated:** 2026-07-23
**Depends on:** every module PRD's own §29 "Release scope" (this document consolidates and sequences those individual decisions — it does not re-derive them)

---

## 1. Prioritisation framework

Every module was scored informally (not a rigid numeric model, given this PRD phase's planning nature) against: **customer value** (does this address an evidenced Phase 2 competitor gap or persona pain point), **operational importance** (is the business unusable without it), **compliance importance** (statutory/legal necessity), **revenue impact**, **implementation complexity**, **dependency risk** (how many other modules block on it), **security risk**. The release grouping below reflects that scoring, weighted heavily toward Module 21 (Permissions) and Module 17 (Workflow Engine) being foundational given how many other modules structurally depend on them (per [09-api-and-event-planning.md](09-api-and-event-planning.md) and nearly every module's own §26 Dependencies section naming them).

## 2. MoSCoW summary by module

| Module | Must Have (MVP) | Should Have | Could Have | Won't Have Yet |
|---|---|---|---|---|
| 1. Core HR | Employee master, effective-dating, directory, org chart, field-level masking | — | Advanced custom-form builder | — |
| 2. Organisation | Legal Entity → Team structure, reorg workflow | — | — | Position Management, headcount planning |
| 3. Onboarding | Preboarding portal, checklists, buddy/induction | New-hire feedback survey automation | — | — |
| 4. Attendance | All check-in modes, shift/holiday config, regularisation, lock | — | Project/billable timesheets | Offline-capture-with-sync (if infeasible for MVP) |
| 5. Leave | All leave types, policy engine, year-end closure | — | — | — |
| 6. Payroll | Salary structures, monthly run, PF/ESI/PT/LWF/TDS/gratuity, payslips, FnF | — | Multi-entity consolidated reporting | Multi-country payroll, direct statutory-portal filing |
| 7. Reimbursements | Claim submission with OCR, policy checks, approval, payout | — | Corporate-card auto-reconciliation | Multi-currency |
| 8. Recruitment | Requisition, posting, pipeline, interviews/scorecards, offers, conversion | Candidate self-scheduling | — | AI resume screening (Module 25) |
| 9. Performance | Goals/OKRs, self/manager review with auto-save, basic calibration, PIPs | — | Full 360-degree feedback | Compensation-benchmarking |
| 10. Learning | Catalogue, mandatory-training auto-assignment, certifications | — | Training budgets | Native content authoring/LMS depth |
| 11. Engagement | Announcements, pulse surveys with anonymity, recognition | — | — | Rewards catalogue, social feed |
| 12. Helpdesk | Ticketing, SLA, knowledge base with deflection | — | — | — |
| 13. Documents | Repository, templates with versioning, triggered generation, e-sign | — | — | — |
| 14. Assets | Inventory, assignment/return, exit-checklist integration | — | Software-licence-compliance depth | Dedicated ITAM/MDM depth |
| 15. Separation | Resignation/termination, exit checklist, access revocation, settlement | Structured exit-interview analytics | — | — |
| 16. ESS/MSS | Employee Home, unified Manager approval inbox | — | Full team-analytics in Manager Home | — |
| 17. Workflow Engine | All chain types, dynamic routing, delegation, escalation, simulation | — | Visual builder refinement | Cross-tenant workflow-template sharing |
| 18. Notifications | In-app, email, push, preferences, digests, failure fallback | SMS (if cost model allows) | — | — |
| 19. Reports | Standard role-based dashboards | — | Full custom cross-module report builder | Predictive/AI analytics (Module 25) |
| 20. Policy/Compliance | Repository, versioning, acknowledgement, compliance calendar | — | Policy quizzes at scale | — |
| 21. Roles/Permissions | Full role/scope model, temporary access, SoD blocking, audit trail | — | SSO/IdP-group role mapping | — |
| 22. System Admin | Setup wizard, SSO/MFA, custom fields, numbering, import/export | — | Sandbox environment, feature flags | — |
| 23. Integrations | API/webhook infra, ≥1 banking, ≥1 biometric, SSO, email, e-sign | — | — | Speculative long-tail connectors |
| 24. Mobile | Check-in/out, leave, approval inbox, payslip view, reimbursement submit | Actionable push notifications | — | Full desktop feature parity |
| 25. AI | None by default | Payroll/attendance anomaly detection (stakeholder review pending) | — | Every other capability (fairness-review-gated) |
| 26. POSH/IC Case Management | IC composition management, confidential intake, case workspace, aggregate compliance dashboard, annual report | — | POSH-specific training-completion depth | Any AI-assisted capability (explicitly excluded, Module 26 §29) |
| 27. Benefits Administration | Plan definition/eligibility, open enrollment, dependant coverage, payroll-deduction handoff | Life-event-triggered off-cycle changes | Benefits cost-benchmarking | Non-insurance benefit types (meal vouchers, wellness stipends) |

## 3. Recommended release phases

### Foundation Release

**Included:** Module 1 (Core HR), Module 2 (Organisation, minus Position Management), Module 21 (Roles/Permissions), Module 17 (Workflow Engine), Module 22 (System Administration, core), Module 18 (Notifications, core), basic audit logging ([10-security-privacy-audit.md](10-security-privacy-audit.md) §13), Module 1 §18's import/export.
**Excluded:** every process-specific module (Attendance, Leave, Payroll, Recruitment, etc.) — Foundation is infrastructure, not yet a usable HR product on its own.
**Dependencies:** none upstream — this is the base every other release builds on.
**Risks:** under-investing in Module 21's design here is the single highest-leverage mistake possible, per Module 21 §27's own risk statement.
**Required integrations:** SSO (at least one identity provider), email delivery.
**Migration requirements:** N/A (no prior release to migrate from).
**Success metrics:** a tenant can be provisioned, an org structure configured, and users assigned correctly-scoped roles.
**Exit criteria:** Module 21's segregation-of-duties blocking and audit trail are functioning correctly under test, per Module 21 §25's acceptance criteria.

### HR Operations Release

**Included:** Module 3 (Onboarding), Module 4 (Attendance), Module 5 (Leave), Module 16 (ESS/MSS), Module 12 (Helpdesk), Module 13 (Documents), Module 20 (Policy/Compliance), Module 15 (Separation), Module 24 (Mobile, core actions), **Module 26 (POSH/IC Case Management)** — placed here rather than deferred to a later release specifically because it is a legal compliance obligation from day one of operating in India with 10+ employees, not a feature to prioritise by customer demand like most of this release's other modules.
**Excluded:** Payroll, Talent modules.
**Dependencies:** Foundation Release (all of it — Attendance/Leave approvals route through Module 17, employee records through Module 1).
**Risks:** Module 4's device-integration reliability (Module 4 §27) is a real, partially-external-dependency risk at this stage.
**Required integrations:** at least one biometric/attendance-device partner, e-signature provider.
**Migration requirements:** for a customer displacing a competitor product, historical attendance/leave-balance import (Module 4 §18, Module 5 §18) becomes relevant here.
**Success metrics:** a full employee lifecycle from onboarding through a routine leave/attendance cycle works end-to-end without manual reconciliation — directly testing this PRD's core "unified data model" differentiation claim in practice.
**Exit criteria:** Cross-Module Workflows #10 and #11 (leave/attendance affecting payroll) produce unambiguous, complete data — testable even before Payroll itself ships, since the *output* of these workflows is what Payroll will consume next.

### Payroll Release

**Included:** Module 6 (Payroll), Module 7 (Reimbursements).
**Excluded:** multi-entity consolidated payroll (Should Have), multi-country payroll (Won't Have Yet).
**Dependencies:** HR Operations Release (Attendance/Leave data must already be reliable — this release's core value proposition depends entirely on the "no ambiguity at handoff" guarantee established in the prior release).
**Risks:** **the highest-risk release in the roadmap**, per Module 6 §27 — statutory-calculation correctness, the rollback-terminology-honesty issue, and regulatory-change-lag operational process all concentrate here. **Recommend this release specifically undergo qualified payroll/legal/CA review before GA**, not just standard QA.
**Required integrations:** at least one banking-disbursal partner (Module 23's most commercially load-bearing dependency), accounting/ERP GL export.
**Migration requirements:** historical payroll-register import for customers displacing a competitor (a genuinely complex migration given statutory-continuity requirements — flagged as needing its own dedicated migration playbook, out of this PRD's scope).
**Success metrics:** a full monthly payroll cycle processes correctly with the variance-gated lock (Module 6 §7.1) catching a deliberately-injected test error during QA, proving the safety mechanism works before relying on it in production.
**Exit criteria:** qualified payroll-professional sign-off on statutory-calculation correctness (Module 6's own Status line at the top of that module's PRD) — this is a hard gate, not a target date to hit regardless.

### Talent Release

**Included:** Module 8 (Recruitment), Module 9 (Performance), Module 10 (Learning), Module 11 (Engagement), **Module 27 (Benefits Administration)**.
**Excluded:** deep AI-assisted capabilities (Module 25, later still).
**Dependencies:** Foundation + HR Operations Releases (candidate-to-employee conversion depends on Module 1; onboarding-triggered training depends on Module 3).
**Risks:** lower financial/legal risk than Payroll, but Module 11's anonymity-enforcement (§7.1 of that module) needs the same rigor as any security-sensitive feature despite this release's generally lower risk profile.
**Required integrations:** job boards, background-verification providers (Module 8), external LMS (Module 10, optional).
**Migration requirements:** candidate-pipeline and performance-history import, if displacing a competitor mid-cycle.
**Success metrics:** Cross-Module Workflow #1 (hire-to-employee) and #13 (review-to-promotion) both function end-to-end without manual re-entry — the specific "zero re-entry at the ATS-to-HRIS handoff" claim this PRD makes as a differentiator (Module 8 §2) is directly testable here.
**Exit criteria:** Module 11's anonymity-enforcement passes a dedicated security review (Module 11 §27).

### Enterprise Release

**Included:** Module 2's Position Management/headcount planning, Module 14 (Assets), advanced Module 19 (custom cross-module report builder), Module 22's sandbox/feature-flags, Module 23's ERP-grade/long-tail integrations, Module 17's workflow-template sharing, multi-entity payroll consolidation (Module 6), multi-country-readiness activation (architecture already present per [05-organisation-data-model.md](05-organisation-data-model.md), commercial/GA activation deferred), Module 25's broader AI-capability rollout (each capability individually fairness-reviewed per Module 25 §10 before its own GA, not a single bundled release).
**Dependencies:** every prior release.
**Risks:** Module 25's bias/fairness risk (§27 of that module) concentrates here — recommend staggering individual AI-capability launches rather than one big-bang Enterprise release for that specific reason.
**Required integrations:** the long-tail Module 23 connectors not justified for earlier releases.
**Migration requirements:** N/A beyond ongoing.
**Success metrics:** a 2,000+-employee, multi-entity customer operates the product without hitting the "outgrown the tool" ceiling named as a competitor gap in Phase 2 research (Product Principle 9's direct test).
**Exit criteria:** each Module 25 capability individually passes its own fairness-review gate (Module 25 §10) before its specific GA — not a single blanket sign-off for the whole release.

## 4. Cross-release notes

- **Module 21 and Module 17 are never "done" at a single release** — every subsequent release's new modules extend their configuration surface (new permission types, new workflow triggers). They belong to Foundation architecturally but require ongoing design attention release over release.
- **Module 6 (Payroll)'s exit criteria (qualified professional sign-off) is a hard gate that could reasonably delay that release's date** — this roadmap deliberately does not attach calendar dates to any release, since Module 6's readiness should be quality-gated, not date-driven, given the financial/legal stakes named throughout this PRD.

## Open questions

- Should the Payroll Release ship before or after the Talent Release, given they're both listed as independent, HR-Operations-Release-dependent tracks? The brief's own suggested structure sequences Payroll before Talent; this PRD retains that sequencing given Payroll's higher operational-necessity score, but flags it as a genuine prioritisation call for Product leadership to confirm, not a research-derived answer.
