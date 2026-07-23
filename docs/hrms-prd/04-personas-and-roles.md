# 04 — Personas and Roles

**Status:** Draft v1 (pending stakeholder review)
**Last updated:** 2026-07-23
**Depends on:** [00-existing-system-audit.md](00-existing-system-audit.md)
**Feeds into:** [05-organisation-data-model.md](05-organisation-data-model.md), Module 21 (Roles and Permissions), Module 16 (ESS/MSS), all module PRDs' "User personas" sections

---

## How to read this document

Each persona below is a **role archetype**, not a literal job title — a mid-market customer might have one person wearing the "HR Executive" and "Payroll Executive" hats simultaneously; a large enterprise might split each persona across several named roles. The **permission model** (Module 21) must therefore be built around **composable role capabilities**, not around these 14 personas as fixed, hard-coded system roles. Where a persona's "Permissions required" section says something like "view team leave balances," that is a *capability* the role model must expose, not a checkbox literally labeled that way in the admin UI.

Every persona's "Sensitive information restrictions" line is a direct input to Module 21's field-level and record-level permission design, and to Module 10 (Security/Privacy) field-masking rules.

---

## 1. Employee

**Goals:** Get paid accurately and on time; take leave without friction; understand my own performance and growth path; resolve HR questions without waiting on email; feel informed about company changes that affect me.

**Responsibilities:** Keep personal/statutory/bank information accurate and current; complete mandatory training and policy acknowledgements; follow attendance and leave policy; participate in performance cycles.

**Common tasks:** Check in/out; apply for leave; view leave balance; view/download payslips; submit reimbursement claims; update personal/emergency-contact/bank details; view team directory and org chart; complete goals/self-review; enrol in learning courses; raise an HR helpdesk ticket; acknowledge policies; view assigned assets; view own document repository (offer letter, payslips, Form 16 equivalent); apply for resignation.

**Information required:** Own profile, own payslips/tax info, own leave balance and history, own goals/reviews, team directory (name/title/contact only — not compensation), company announcements/policies relevant to them, own assigned assets.

**Permissions required:** Full CRUD on a defined subset of own profile fields (self-service-editable fields only — e.g., can edit personal address, cannot edit designation/grade/compensation); create leave/reimbursement/regularisation requests; read own payroll/tax/performance/document records; read (not edit) team directory within visibility rules.

**Pain points (industry-wide, from competitor research):** Chasing HR/manager for approval status with no visibility into where a request sits; payslip/tax-declaration UX that assumes finance literacy; mobile apps that lag the web app in functionality (documented gap in Zoho People, greytHR per competitor research); unclear reimbursement policy rules leading to rejected claims after the fact.

**High-frequency workflows:** Check-in/out, leave application, payslip download, helpdesk ticket.

**Low-frequency, high-risk workflows:** Bank/PAN/Aadhaar detail changes (payroll-impacting — must be validated and possibly re-verified, not silently trusted); resignation submission (irreversible-feeling action, needs clear confirmation and withdrawal window before HR action).

**Mobile requirements:** Check-in/out (with geo/selfie where policy requires), leave apply/view balance, payslip view, approval-status visibility, helpdesk ticket raise, push notifications for approvals/announcements. This is the highest-frequency-use persona on mobile — see Module 24.

**Reporting requirements:** None (consumer of own data only, not a report-builder persona).

**Notifications required:** Leave/reimbursement approval or rejection, payroll processed/payslip available, policy update requiring acknowledgement, review cycle open, training due/expiring, asset assignment, document expiry (e.g., work-authorisation renewal reminder).

**Sensitive-information restrictions:** Cannot see own compensation-revision history beyond current CTC breakdown (unless policy allows); cannot see peers' compensation, performance ratings, or disciplinary records; cannot see HR notes/case files about themselves (jurisdiction-dependent — flagged as an **open legal question**, see Open Questions).

---

## 2. People Manager

**Goals:** Keep the team staffed, compliant, and performing; clear approvals fast without becoming a bottleneck; make informed compensation/promotion recommendations; see problems (attrition risk, burnout, attendance issues) before they escalate.

**Responsibilities:** Approve/reject direct reports' leave, attendance regularisation, reimbursements, timesheets; conduct performance reviews and 1:1s; participate in hiring for their team; confirm probation; recommend transfers/promotions/compensation changes; ensure team completes mandatory training/compliance tasks.

**Common tasks:** Review approval inbox; view team attendance/leave calendar; conduct goal check-ins and reviews; approve probation confirmation; view team analytics/dashboards; delegate approval authority when on leave; raise team-related HR requests.

**Information required:** Direct and (for skip-level views, where entitled) indirect reports' attendance, leave, performance, goals, org details; team headcount/vacancy status; team-level (not individual peer-manager) compensation bands for planning purposes — not other managers' teams' data.

**Permissions required:** Read/approve scope limited to **direct reporting hierarchy** (configurable to include dotted-line reports); cannot view or edit HR-administrator-level configuration; cannot see individual compensation numbers of peers' teams; approve actions bounded by defined workflow/amount/grade thresholds (Module 17).

**Pain points:** Approval fatigue from low-value/rubber-stamp approvals; no single inbox across leave/expense/timesheet/onboarding-tasks (forces managers to check multiple modules); performance review UX that dumps 20 direct reports' surveys into a spreadsheet-like experience with no prioritisation; unclear "why is this pending" visibility when an approval is stuck upstream (e.g., waiting on HRBP).

**High-frequency workflows:** Approving leave/regularisation/reimbursement, checking team calendar before approving to avoid coverage gaps.

**Low-frequency, high-risk workflows:** Salary revision recommendation, promotion recommendation, probation non-confirmation (termination-adjacent), performance improvement plan initiation — these are payroll- and legally-sensitive and need strong audit trails and guardrails against accidental submission.

**Mobile requirements:** Approval inbox (leave/expense/regularisation at minimum), team calendar view, push notification on new approval request — this is the second-highest mobile-use persona given how often approvals happen away from a desk.

**Reporting requirements:** Team attendance/leave summary, team headcount/attrition, goal-completion status, team compensation-planning view (scoped), team training-completion status.

**Notifications required:** New approval request, SLA-approaching-breach reminder on a pending approval, direct report's probation-confirmation due date, review-cycle deadlines, team member's work anniversary/birthday (engagement-nudge), policy acknowledgement overdue for a report.

**Sensitive-information restrictions:** Cannot view compensation of employees outside direct/dotted-line hierarchy; cannot view HR-case/grievance details unless they are a named party to the process; cannot override payroll-locked periods.

---

## 3. HR Executive

**Goals:** Keep day-to-day HR operations running smoothly across the employee lifecycle without being the bottleneck for every routine request.

**Responsibilities:** Process onboarding/offboarding administrative steps; maintain employee master data accuracy; handle first-line HR helpdesk tickets; coordinate document collection/verification; support attendance/leave exception handling; assist with recruitment coordination (interview scheduling, offer letter generation).

**Common tasks:** Process new-joiner onboarding checklist items; verify submitted documents; respond to HR helpdesk tickets; generate letters (offer/confirmation/experience); update employee records (transfers, designation changes) within delegated authority; run routine reports (headcount, joiners/exits).

**Information required:** Full employee master data within their assigned scope (department/location/legal-entity, depending on org design); onboarding/offboarding checklist status; document repository; helpdesk ticket queue.

**Permissions required:** Create/edit employee records within scope (not necessarily compensation fields — often payroll-restricted, see Payroll Executive); process document verification; generate/send letters from approved templates; cannot typically approve payroll runs or access other departments' sensitive data unless HRBP-scoped.

**Pain points:** Manually chasing document submission and re-verifying inconsistent formats; duplicate data entry across HRIS/payroll/other systems when integrations are one-way or absent (a confirmed gap in Zoho's People↔Payroll sync per competitor research); ticket volume dominated by repetitive questions ("where's my payslip") that a self-service portal or knowledge base should absorb.

**High-frequency workflows:** Onboarding checklist processing, helpdesk ticket triage, document verification.

**Low-frequency, high-risk workflows:** Bulk employee data import/correction, processing a termination's administrative checklist (access revocation coordination, asset recovery), correcting an employee record post-payroll-lock (requires special workflow, see Cross-Module Workflow #18).

**Mobile requirements:** Ticket queue triage, onboarding checklist status check, approval delegation — moderate mobile need, not as high-frequency as Employee/Manager personas.

**Reporting requirements:** Joiners/exits, onboarding-completion-rate, document-compliance status, helpdesk SLA/volume.

**Notifications required:** New ticket assigned, document uploaded pending verification, onboarding task overdue, probation-confirmation date approaching for employees in their scope.

**Sensitive-information restrictions:** Typically restricted from viewing compensation/bank/statutory-ID fields unless explicitly granted (these often sit behind a stricter Payroll-Administrator-only permission tier); restricted from other business units'/legal entities' data unless scope explicitly includes them.

---

## 4. HR Administrator

**Goals:** Own HR policy, process, and data integrity for their assigned scope (department/legal entity/full org, depending on seniority); ensure compliance and audit-readiness; configure the system to match evolving org needs without needing engineering support.

**Responsibilities:** Configure organisation structure, policies (leave/attendance/holiday calendars), workflows/approval chains, roles/permissions within their delegated authority; own compliance calendar; manage vendor/integration relationships (background-verification, LMS, etc.); approve high-impact HR actions (terminations, org restructuring) within their authority; oversee data-import/migration quality.

**Common tasks:** Configure leave/attendance policies per employee segment; set up approval workflows; manage custom fields/forms; run compliance and audit reports; oversee bulk imports; manage document templates; configure notification rules; review audit logs for suspicious activity.

**Information required:** Full organisational data within scope, all workflow/policy configuration, audit logs, compliance calendar, integration status/health.

**Permissions required:** Broad configure/create/edit/approve permissions across HR modules within scope; access to audit logs; ability to define other roles' permissions (delegated role administration) but not necessarily system-level (tenant) configuration — that's System Administrator's domain (Module 22).

**Pain points:** Configuration complexity that requires vendor support tickets for routine changes (a documented competitor gap — Zoho's reliance on Deluge scripting for advanced automation, RazorpayX's "not customisable, you adapt to us" complaint per research); lack of a safe way to test policy changes before they go live org-wide (no sandbox/simulation); difficulty reconstructing "why did this happen" after an audit finding, when audit trail is fragmented across modules.

**High-frequency workflows:** Policy/workflow configuration changes, approval-chain adjustments, exception handling escalated from HR Executives.

**Low-frequency, high-risk workflows:** Bulk data import/migration, org-wide restructuring, workflow-engine changes affecting live in-flight approvals, permission-model changes (privilege escalation risk if done carelessly — needs its own audit trail, see Module 21).

**Mobile requirements:** Approval/escalation handling, alerting on system anomalies (e.g., failed integration) — lower priority than Employee/Manager mobile needs; primarily a desktop/web persona.

**Reporting requirements:** Full HR operations dashboard (Module 19): headcount, attrition, diversity, compliance-task status, audit activity, integration-failure rate.

**Notifications required:** Compliance-deadline approaching, integration failure, workflow-engine error, audit-flagged anomalous access, bulk-import completion/errors.

**Sensitive-information restrictions:** Scope-dependent — a department-level HR Administrator should not see other departments' compensation data by default; a global HR Administrator may see everything except payroll-processing-specific fields (bank account numbers, statutory IDs), which often sit behind Payroll Administrator's stricter tier by design (segregation of duties, see Module 21/Module 10).

---

## 5. Recruiter

**Goals:** Fill open positions quickly with quality candidates while giving hiring managers and candidates a good experience.

**Responsibilities:** Manage job requisitions, source and screen candidates, coordinate interviews, manage offer process, maintain talent pool, report on recruitment funnel metrics.

**Common tasks:** Post jobs, parse/review resumes, schedule interviews, collect interview feedback/scorecards, generate and send offers, track candidate pipeline stage, manage referrals, run background-check requests.

**Information required:** Job requisitions and approval status, candidate profiles/applications, interview panel availability and feedback, offer templates and approval chain, source-of-hire and funnel analytics.

**Permissions required:** Create/manage requisitions (within approval workflow), full candidate-record CRUD during active pipeline, initiate background checks, generate offers within approved compensation bands (cannot self-approve outside band without escalation), convert accepted-offer candidates to employee records (handoff to Onboarding, see Cross-Module Workflow #1).

**Pain points:** Duplicate candidate records across sourcing channels; interview scheduling back-and-forth eating recruiter time (competitor gap — few products documented deep two-way calendar sync); disconnect between ATS and HRIS at the hire-conversion step causing re-keying of data; feedback collection that arrives late or incomplete, stalling decisions.

**High-frequency workflows:** Resume screening, interview scheduling, candidate-stage updates.

**Low-frequency, high-risk workflows:** Offer generation/revision (compensation-sensitive, needs approval trail), background-check initiation (PII-sensitive, needs consent tracking), candidate rejection at final stage (reputational/legal sensitivity — needs consistent, defensible process).

**Mobile requirements:** Interview feedback submission on the go, candidate pipeline status check, approval notifications for offers — moderate need.

**Reporting requirements:** Time-to-hire, cost-per-hire, source effectiveness, funnel conversion by stage, requisition ageing.

**Notifications required:** New requisition approved, interview feedback overdue, offer approval status, candidate response (accept/reject) received, background-check result received.

**Sensitive-information restrictions:** Candidate PII must be scoped to active-pipeline access only (not indefinite access to rejected/withdrawn candidates beyond a defined retention period — data-privacy requirement, see Module 10); compensation-band visibility should be scoped to what's needed for the requisition, not org-wide compensation data.

---

## 6. Payroll Executive

**Goals:** Process an accurate, on-time payroll run every cycle with minimal manual correction and no compliance misses.

**Responsibilities:** Collect and validate payroll inputs (attendance, leave, reimbursements, one-time payments/deductions); run payroll preview and reconcile exceptions; generate payslips; support employee payroll queries; prepare statutory filing data.

**Common tasks:** Review payroll-input exception reports; validate LOP/attendance sync; process reimbursement payroll integration; run payroll preview; investigate payroll variance; respond to payroll-related helpdesk tickets; generate bank transfer files (for Payroll Administrator's sign-off).

**Information required:** Full compensation/statutory/bank data for employees in their payroll group; attendance/leave data feeding payroll; prior payroll-run history for variance comparison.

**Permissions required:** Read/edit payroll-input data; run payroll preview (not final process/lock — typically reserved for Payroll Administrator as a segregation-of-duties control); read compensation and statutory-ID fields (this is one of the few roles with broad access to this sensitive data class, by necessity).

**Pain points:** Manual reconciliation between attendance/leave systems and payroll when integration is imperfect (a theme across every competitor researched — attendance-payroll sync is a recurring failure point); last-minute one-time payroll input changes arriving after cutoff, forcing rework; unclear audit trail when a number changes between preview and final run, undermining trust in the numbers.

**High-frequency workflows:** Monthly payroll-input collection and validation, payslip generation and distribution.

**Low-frequency, high-risk workflows:** Off-cycle payroll runs (bonus, correction), retroactive salary revision processing, full-and-final settlement calculation — all require careful review since errors here are financially and legally consequential and hard to reverse once bank transfer is initiated.

**Mobile requirements:** Low — primarily a desktop-intensive, detail-heavy role; exception alerts on mobile are useful, full processing is not a mobile use case.

**Reporting requirements:** Payroll register, payroll variance, statutory-deduction summary, reimbursement-payroll reconciliation.

**Notifications required:** Payroll-input cutoff approaching, exception/variance detected, payroll-run status (preview ready, processing complete), statutory-filing deadline approaching.

**Sensitive-information restrictions:** Access to compensation/bank/statutory-ID data should itself be logged and reviewable (privileged-access monitoring, Module 10) — this role is a designed exception to general field-masking, not evidence that such data should be broadly visible elsewhere.

---

## 7. Payroll Administrator

**Goals:** Guarantee payroll accuracy, statutory compliance, and financial control; own the final "process and pay" decision and its audit trail.

**Responsibilities:** Final payroll approval/processing/lock; statutory compliance filing ownership (PF/ESI/PT/LWF/TDS/gratuity); payroll policy and salary-structure configuration; payroll audit and reconciliation; managing payroll rollback in exceptional cases; liaising with Finance for cost-centre allocation and GL export.

**Common tasks:** Final review and lock of payroll run; approve off-cycle/retroactive runs; sign off on bank transfer file; oversee statutory challan generation/filing tracking; configure salary structures and compliance rules; manage payroll audit trail reviews.

**Information required:** Everything Payroll Executive has, plus org-wide payroll configuration, multi-entity payroll consolidation, compliance-deadline calendar, cost-centre/GL mapping.

**Permissions required:** Process/lock/unlock payroll (highest-privilege payroll action — should require strong authentication and produce an immutable audit record, see Module 10); configure statutory rules; approve off-cycle payroll; access to full compensation data org-wide (or within their legal-entity scope for multi-entity setups).

**Pain points:** Regulatory-change lag — statutory rule updates (PT slabs, labour codes) arriving after a product update rather than proactively, forcing manual workaround (a theme surfaced in competitor research on Zoho Payroll's evolving labour-code support); payroll rollback being technically difficult or undocumented once bank files are generated, creating real financial/legal exposure if an error is caught late; multi-entity consolidation requiring manual spreadsheet work when the product doesn't natively support it well.

**High-frequency workflows:** Monthly payroll lock/process decision.

**Low-frequency, high-risk workflows:** Payroll rollback, retroactive salary-revision batch processing, statutory-rule configuration changes, multi-entity payroll consolidation — every one of these is high-blast-radius and needs simulation/preview before commit, plus an unambiguous audit trail (who changed what statutory rule, when, effective from what date).

**Mobile requirements:** Low — approval/sign-off notification and status visibility only; actual processing is a deliberate, desktop, "measure twice" action that should arguably be *harder* to do accidentally from a phone, not easier.

**Reporting requirements:** Payroll register, payroll variance, multi-entity payroll consolidation, statutory compliance/challan-tracking, payroll audit trail.

**Notifications required:** Payroll ready for final approval, statutory filing deadline, compliance-rule update requiring configuration action, payroll-lock/rollback events (self-notification for confirmation/audit purposes).

**Sensitive-information restrictions:** This role is intentionally the most privileged on compensation/statutory data — the control is not restricting their access but **monitoring and logging** it (every view/export/download of bulk compensation data should be logged per Module 10's "bulk-download monitoring" requirement).

---

## 8. Finance User

**Goals:** Understand and control HR-driven cost (payroll, reimbursements, benefits) as part of overall company financials; ensure clean accounting-system handoff.

**Responsibilities:** Reconcile payroll cost against budget/GL; validate cost-centre allocations; approve high-value reimbursements/expenses per finance policy; support statutory/financial audit with HR-cost data.

**Common tasks:** Review payroll-cost reports by cost centre/department/legal entity; export payroll journal entries to accounting system; reconcile reimbursement payouts; review headcount-cost trend reports.

**Information required:** Aggregated/cost-centre-level payroll cost data (not necessarily individual employee compensation detail, depending on org policy); reimbursement summaries; budget-vs-actual headcount cost.

**Permissions required:** Read access to payroll-cost and cost-centre reports; export to accounting/ERP; typically **no edit access** to HR/payroll operational data — a read-and-reconcile role, not a processing role (segregation of duties).

**Pain points:** Payroll-cost data arriving in a format that doesn't map cleanly to the GL/chart-of-accounts, forcing manual remapping every cycle; no drill-down from an aggregate number to the underlying employee-level detail when reconciling a variance (while still respecting compensation-privacy boundaries); disconnect between HR's view of "cost centre" and Finance's chart-of-accounts structure.

**High-frequency workflows:** Monthly payroll-cost reconciliation.

**Low-frequency, high-risk workflows:** Year-end/audit-period detailed reconciliation, cost-centre restructuring impact analysis.

**Mobile requirements:** Low — a reporting/reconciliation persona, desktop-oriented.

**Reporting requirements:** Cost-centre payroll allocation, payroll-cost trend, reimbursement summary, budget-vs-actual headcount cost — all from Module 19's Finance dashboard.

**Notifications required:** Payroll journal export ready, reconciliation variance flagged, budget-threshold alerts.

**Sensitive-information restrictions:** Should generally see cost aggregates, not individual compensation line items, unless explicitly granted broader access for audit purposes — this boundary is a common source of organisational friction and should be a configurable policy, not hard-coded.

---

## 9. Department Head

**Goals:** Run their department/business-unit efficiently — right headcount, right cost, right performance — with visibility across all teams under them, not just direct reports.

**Responsibilities:** Approve department-level headcount/budget requests; oversee multiple People Managers' teams; make final call on department-level promotions/compensation within budget; represent department in org planning.

**Common tasks:** Review department-wide dashboards (headcount, attrition, cost, performance distribution); approve escalated requests beyond a People Manager's authority threshold; participate in calibration sessions; approve position/headcount requisitions.

**Information required:** All People Manager information, aggregated and drillable across the full department; department budget/cost data; cross-team comparison views (e.g., attrition by team within department).

**Permissions required:** Skip-level read access across the full department hierarchy (not just direct reports); approval authority at higher thresholds than a People Manager (e.g., compensation changes above a certain %, cross-team transfers); cannot see other departments' equivalent detail unless org design grants broader scope.

**Pain points:** Dashboards that show People-Manager-level detail but no true department roll-up (forces manual aggregation across each manager's numbers); calibration processes that are spreadsheet-driven outside the system because the product doesn't support cross-team rating normalisation well.

**High-frequency workflows:** Reviewing department dashboards, approving escalated requests.

**Low-frequency, high-risk workflows:** Department restructuring, calibration-session rating adjustments (can affect many employees' outcomes at once — needs strong audit trail and ideally a simulation/preview step), large-scale compensation-band changes.

**Mobile requirements:** Dashboard viewing and approval actions while travelling — moderate-to-high given seniority and travel patterns.

**Reporting requirements:** Full department-level headcount/attrition/cost/performance dashboards with drill-down to team level.

**Notifications required:** Escalated approval pending, department budget threshold alerts, calibration-session deadlines.

**Sensitive-information restrictions:** Should see department-wide compensation/performance data (needed for the role) but this access should be logged given its breadth (Module 10 privileged-access monitoring); should not see other departments' equivalent data without explicit cross-functional grant.

---

## 10. Leadership / CXO

**Goals:** Understand organisational health (headcount, cost, attrition, engagement, diversity, compliance posture) at a glance to inform strategic decisions; trust that the numbers are accurate without needing to interrogate the system directly.

**Responsibilities:** Set org-wide policy direction; approve major organisational changes (restructuring, large compensation programs); represent the organisation in board/investor reporting where HR metrics are relevant.

**Common tasks:** View executive dashboards; drill into specific metrics occasionally; receive scheduled reports/digests; approve major initiatives that HR/Finance bring to them.

**Information required:** Org-wide aggregated metrics (headcount, attrition, DEI, cost, engagement scores, compliance status); rarely individual-employee-level detail except in escalated/exceptional cases.

**Permissions required:** Broad read access to aggregated/dashboard-level reporting org-wide; typically **not** operational CRUD access to HR records — this is a consumption persona, and over-provisioning this role with edit access is itself a security risk worth flagging in Module 21.

**Pain points:** Dashboards that require HR/Finance intervention to produce a board-ready number (no self-serve executive summary); metrics that don't reconcile across HR/Finance/Payroll views of "headcount" or "cost" due to timing/definition mismatches; lack of trend context (a single point-in-time number without historical trend is not decision-useful).

**High-frequency workflows:** Periodic (weekly/monthly) dashboard review.

**Low-frequency, high-risk workflows:** Approving org-wide restructuring or compensation programs — decisions made off system-provided data, so data accuracy/trust is paramount, but the *action* itself often happens outside the HRMS (board approval, etc.) — the HRMS's job is to make the underlying data trustworthy and exportable.

**Mobile requirements:** Executive dashboard summary view — high value, low interaction depth (glanceable, not data-entry).

**Reporting requirements:** Leadership dashboard (Module 19): headcount, attrition, DEI, cost, engagement, compliance-posture summary, with export for board reporting.

**Notifications required:** Scheduled digest (weekly/monthly), critical compliance or risk alert requiring executive attention only.

**Sensitive-information restrictions:** Should generally not have blanket individual-employee compensation/performance visibility without a defined business reason — even at CXO level, least-privilege should apply, with a documented escalation path for cases where individual-level detail is genuinely needed (e.g., executive compensation review).

---

## 11. IT Administrator

**Goals:** Ensure secure, reliable, compliant technical operation of the HRMS — provisioning, integrations, data security — without needing to be an HR domain expert.

**Responsibilities:** Manage SSO/identity integration, user provisioning/deprovisioning tied to HR events (joiner/mover/leaver), API keys and webhook configuration, integration health monitoring, data-export/backup coordination, security-incident response coordination.

**Common tasks:** Configure SSO/MFA; manage API keys/webhooks; monitor integration failures; coordinate access-revocation timing with offboarding; review security/audit logs from a system-health (not HR-process) lens; manage IP restrictions/session policies.

**Information required:** System configuration, integration logs, security/audit logs, user-provisioning status — **not** HR-content data (compensation, performance, personal details) as a matter of least-privilege, even though this role has high system-level access.

**Permissions required:** Tenant/system-configuration access (Module 22) — SSO, MFA, API keys, webhooks, integration management; explicitly **should not** default to HR-data read access — this is a critical design principle (a common real-world anti-pattern is over-granting IT admins broad HR-data visibility just because they hold the "Administrator" label; this PRD should design against that by separating *system* administration from *HR-data* administration as distinct permission domains).

**Pain points:** Offboarding access-revocation timing gaps (an employee's last working day and their actual system-access cutoff not being tightly, automatically linked — a recurring cross-module workflow risk, see Workflow #15/#16); integration failures with unclear root-cause visibility; SSO/identity-provider changes on the corporate side breaking HRMS access unexpectedly.

**High-frequency workflows:** User provisioning/deprovisioning tied to joiner/mover/leaver events (largely automated, but exceptions need handling).

**Low-frequency, high-risk workflows:** SSO/identity-provider migration, API-key rotation/revocation after a suspected compromise, bulk access-review/cleanup.

**Mobile requirements:** Low — alerting on critical system/security events is the main mobile need; configuration work is desktop-only.

**Reporting requirements:** Integration-failure rate, access-review/audit reports, session/security-anomaly reports.

**Notifications required:** Integration failure, security anomaly/suspicious-access detection, SSO/certificate-expiry warnings, offboarding-triggered deprovisioning confirmation.

**Sensitive-information restrictions:** Should be explicitly scoped away from HR-content data by default (see above) — this is one of the more important, easy-to-get-wrong permission-design decisions in the whole system.

---

## 12. Compliance / Audit User

**Goals:** Verify that HR/payroll processes are compliant with statutory and internal-policy requirements, and be able to reconstruct any historical decision or transaction for audit purposes.

**Responsibilities:** Conduct periodic internal audits; support external/statutory audits; maintain compliance calendar and evidence repository; investigate flagged anomalies; ensure data-retention and legal-hold policies are followed.

**Common tasks:** Query audit logs; pull evidence for a specific compliance requirement; review policy-acknowledgement completion; review access-change history; verify statutory-filing completeness against the compliance calendar.

**Information required:** Full audit-log access (read-only) across HR/payroll modules; compliance-calendar and evidence repository; policy-acknowledgement records; historical (not necessarily current-state-only) employee/payroll records for the audit period in question.

**Permissions required:** Broad **read-only** access across modules for audit purposes, explicitly **no edit/process rights** — a compliance user who can also edit the records they're auditing is a segregation-of-duties failure and should be treated as a hard design rule, not a configurable option left to the customer to get wrong.

**Pain points:** Audit trails that are incomplete, module-siloed, or missing the "reason"/"approval reference" context behind a change (raw before/after values without context are hard to audit); inability to reconstruct point-in-time organisational state (e.g., "who was this employee's manager on 15 March last year") when hierarchy isn't effective-dated; evidence scattered across systems instead of centralised.

**High-frequency workflows:** Periodic internal-audit sampling and log review.

**Low-frequency, high-risk workflows:** Statutory/external audit support (time-boxed, high-stakes, reputationally sensitive if evidence can't be produced); legal-hold investigation (freezing specific records from normal retention/deletion).

**Mobile requirements:** Low — a deep, desktop-oriented investigative role.

**Reporting requirements:** Audit-activity report, role/permission-change history, compliance-task completion status, data-retention/legal-hold status.

**Notifications required:** Compliance-deadline approaching, anomalous-access flag requiring investigation, legal-hold applied/lifted confirmation.

**Sensitive-information restrictions:** Paradoxically needs *broad* read access to do the job, which makes **this role's own access the single most important thing to log and periodically review** (who audits the auditor) — a specific requirement to carry into Module 10/21.

---

## 13. System Administrator

**Goals:** Keep the platform itself (as opposed to any one tenant's HR configuration) running, secure, and correctly provisioned across tenants (for the SaaS vendor's own operations team) or across the full org (for a large enterprise customer's platform-owner role).

**Responsibilities:** Tenant provisioning/configuration, feature-flag management, subscription/usage-limit management, platform-level security settings, sandbox-environment management, data-migration oversight, backup/DR coordination.

**Common tasks:** Provision new tenant/organisation; manage feature flags and subscription tier; monitor system health/usage limits; manage sandbox environment; oversee large data migrations; configure tenant-level branding/domain/email settings.

**Information required:** Tenant configuration and health data, subscription/usage metrics, system-level logs — **not**, by default, tenant HR-content data (same least-privilege principle as IT Administrator, but at platform scope rather than single-org scope).

**Permissions required:** Highest system-configuration privilege tier (Module 22); this role's actions (e.g., tenant provisioning, feature-flag changes affecting many users at once) should require strong authentication and produce immutable audit records given the blast radius.

**Pain points:** Not modeled from competitor research (this is an internal/platform-operations persona, not something visible in customer-facing competitor products) — flagged as an area where our own product-ops requirements (not competitor benchmarking) should drive detailed requirements in Module 22.

**High-frequency workflows:** Routine tenant/subscription monitoring.

**Low-frequency, high-risk workflows:** Tenant provisioning, feature-flag rollout, data migration, sandbox-to-production promotion, disaster-recovery execution — every one of these has organisation-wide (or, for the SaaS vendor's own System Administrator, cross-tenant) blast radius and needs staged rollout/rollback capability.

**Mobile requirements:** Low — alerting only; this is a control-room desktop role.

**Reporting requirements:** System health, usage-limit/subscription reports, tenant-provisioning audit trail.

**Notifications required:** System-health alerts, usage-limit approaching, failed backup/DR test, feature-flag rollout status.

**Sensitive-information restrictions:** Same least-privilege-from-HR-content principle as IT Administrator; additionally, for the multi-tenant SaaS vendor's own System Administrator role, **cross-tenant data isolation must be absolute** — this role manages tenant *infrastructure*, not tenant *content*, and the permission model must make it structurally difficult (not just policy-discouraged) to cross that boundary. This is one of the most important requirements in the entire PRD and is carried forward explicitly into Module 22 and Phase 11 (Security).

---

## 14. External Consultant / Limited-Access User

**Goals:** Complete a specific, time-boxed engagement (e.g., a contract recruiter, an external auditor, an outsourced payroll-compliance consultant, a legal advisor) with exactly the access needed and nothing more, then have that access cleanly expire.

**Responsibilities:** Varies entirely by engagement — could be recruitment support, compliance review, legal case support, specialist payroll consulting for a specific country/entity.

**Common tasks:** Whatever the engagement requires, scoped narrowly (e.g., view candidate pipeline for one requisition; view payroll-compliance data for one legal entity; view one employee's case file for a legal matter).

**Information required:** Strictly scoped to the engagement — this persona is defined by **narrowness** of access, not by a fixed task list.

**Permissions required:** Time-boxed (start/end date), custom-population-scoped access (Module 21's "custom population access" and "temporary access" concepts exist specifically for this persona); access should **auto-expire** without requiring someone to remember to manually revoke it — a common real-world failure mode (stale external-consultant access lingering for months) that this PRD should design against explicitly.

**Pain points:** Products that only offer fixed roles (Admin/Manager/Employee) force over-provisioning of external users out of sheer lack of a narrower option — a real and common failure mode this PRD should explicitly design against via Module 21's custom-population and temporary-access capabilities.

**High-frequency workflows:** Whatever the narrow engagement task is, for the duration of the engagement.

**Low-frequency, high-risk workflows:** None inherent to the role itself, but **the granting and revoking of this access** is itself a high-risk, low-frequency, audit-critical workflow that deserves its own acceptance criteria in Module 21 (e.g., "Given a temporary-access grant with an end date, when that date passes, then access is automatically and verifiably revoked, and this is logged").

**Mobile requirements:** Engagement-dependent; not a defining characteristic of this persona.

**Reporting requirements:** None inherent; a System/HR Administrator should be able to report on *all active external-consultant grants* org-wide as a standing compliance report (Module 21's "access-review reports").

**Notifications required:** Access-expiry-approaching reminder (to the granting administrator, so they can extend deliberately or let it lapse); access-granted/revoked confirmation.

**Sensitive-information restrictions:** By definition, the narrowest of any persona — this is the acid test for whether the permission model is genuinely granular (field/record/population/time-scoped) rather than role-label-based.

---

## Cross-persona notes

- **Composability, not exclusivity:** most real customers will map multiple personas onto fewer human roles (e.g., one person is HR Executive + Payroll Executive + Recruiter in a 50-person company). The permission model (Module 21) must support assigning multiple capability sets to one user account, not force a single fixed role per user.
- **Segregation-of-duties pairs to preserve in Module 21 design**, drawn directly from the personas above: Payroll Executive (prepare) vs. Payroll Administrator (approve/lock); HR Administrator (configure/operate) vs. Compliance/Audit User (review, read-only, cannot edit what they audit); IT/System Administrator (platform access) vs. HR roles (HR-content access) — these should not default to the same person having both without explicit, logged justification.
- **Mobile-first personas** (highest-frequency mobile use, directly informing Module 24 prioritisation): Employee, People Manager. **Mobile-relevant but lower-frequency:** HR Executive, Recruiter, Department Head, Leadership. **Effectively desktop-only:** Payroll Administrator, Finance User, IT Administrator, Compliance/Audit User, System Administrator.

## Open questions

- OQ-5: In which jurisdictions (starting with India) can an employee legally be denied access to HR case notes/grievance records about themselves, and does this vary by record type (performance vs. disciplinary vs. grievance)? Needs legal review before Module 21 finalises the Employee persona's record-level restrictions.
- OQ-6: For the "External Consultant" persona, does the product need a formal **NDA/data-processing-agreement acknowledgement gate** before access is granted (relevant given payroll/PII exposure)? Flagged for legal/compliance stakeholder input.
- OQ-7: Should "Department Head" be a distinct system role or simply "People Manager with skip-level scope"? Leaning toward the latter (scope parameter, not a separate role) for permission-model simplicity — flagged for Module 21 design review rather than decided here.
