# 14 — Success Metrics

**Status:** Draft v1 (pending stakeholder review)
**Last updated:** 2026-07-23
**Depends on:** [03-product-vision.md](03-product-vision.md) (success criteria this document operationalises into measurable metrics), every module's own §21 reporting requirements

---

## How to read this document

Metrics are grouped by type per the brief's explicit categories, since a single flat list would obscure which stakeholder owns which number and what kind of decision it should inform. Every metric traces to either a Phase 2 competitor-research finding (i.e., it measures whether this product actually delivers on a claimed differentiator) or a specific module's own stated objective — none are generic SaaS-metrics-template filler.

---

## Product metrics

| Metric | Definition | Target (initial assumption) | Traces to |
|---|---|---|---|
| Time to onboard an employee | Offer-accepted to Ready-for-Activation (Cross-Module Workflow #1/#2) | Faster than the customer's pre-adoption baseline — no absolute target asserted without customer-specific baseline data | Module 3 §3 |
| Onboarding-task on-time completion rate | % of checklist items completed by their due date | ≥90% | Module 3 §21 |
| Attendance regularisation turnaround time | Submission to approval decision | ≤24 hours median | Module 4 §21, Module 17 §21 |
| Leave approval turnaround time | Submission to approval decision | ≤24 hours median | Module 5 §21 |
| Payroll input error rate | % of payroll runs requiring a correction after initial preview | Trending toward zero over successive cycles per tenant (learning-curve-adjusted) | Module 6 §7.1's variance-gate purpose |
| Payroll correction rate | % of payroll runs requiring a post-lock correction (Module 6 §7.3) | <2% | Module 6 §27's risk |
| Payroll processing duration | Time from input-collection-complete to lock, for a standard run | Bounded per [11-non-functional-requirements.md](11-non-functional-requirements.md) §18 | Module 6 §3 |
| Employee self-service adoption | % of employees who complete at least one self-service action monthly | ≥80% | Module 16 §3, directly testing the "self-service that actually reduces HR ticket volume" claim |
| Manager self-service adoption | % of managers using the unified Approval Inbox weekly | ≥90% | Module 16 §3 |

## Operational metrics

| Metric | Definition | Target | Traces to |
|---|---|---|---|
| HR ticket volume | Total Module 12 tickets per employee per month | Declining trend post-adoption | Market research §5/§7 — the core self-service-deflection thesis |
| HR ticket resolution time | Submission to resolution | Per configured SLA (Module 12 §9) | Module 12 §21 |
| Knowledge-base deflection rate | % of ticket-creation attempts resolved via suggested article instead | Increasing trend, target ≥30% within 6 months of a category's knowledge-base maturity | Module 12 §2/§21, this PRD's specific operational-efficiency thesis |
| Policy acknowledgement rate | % of in-scope employees acknowledging current policy version within a configured window | ≥95% within 2 weeks of publication | Module 20 §21 |
| Data completeness | % of employee records with all mandatory fields populated | ≥98% | Module 1 §9's profile-completeness indicator |
| Employee-profile accuracy | Proxy: rate of employee-initiated correction requests (a high rate suggests upstream data-entry or import-quality issues) | Declining trend | Module 1 |
| Mobile adoption | % of eligible high-frequency actions (check-in/out, leave, approvals) performed via mobile | ≥50% for Employee/Manager personas within 3 months, per [04-personas-and-roles.md](04-personas-and-roles.md)'s mobile-first designation | Module 24 §21 |
| Monthly active users | % of licensed users active in a rolling 30-day window | ≥85% | General product-health signal |
| Approval bottlenecks | Count/identity of approvers whose average turnaround significantly exceeds their peer group | Actively monitored, no fixed target (this is a diagnostic metric, not a target to hit) | Module 17 §21's bottleneck-report purpose |
| Report usage | % of standard dashboards viewed at least monthly by their intended persona | ≥70% | Module 19 §3 |
| Integration failure rate | % of sync attempts failing, per integration | <1% for critical integrations (banking, access-revocation), <5% for lower-severity ones | Module 23 §21, [10-security-privacy-audit.md](10-security-privacy-audit.md) |

## Compliance metrics

| Metric | Definition | Target | Traces to |
|---|---|---|---|
| Statutory-filing on-time rate | % of compliance-calendar tasks (Module 20 §7.2) completed by deadline | 100% (this is a hard-compliance area, not a "good enough" metric) | Module 20 §21, Module 6 |
| Mandatory-training completion rate | % of in-scope employees completing required training by deadline | ≥95% | Module 10 §21 |
| Audit-readiness response time | Time to produce a specific requested piece of compliance evidence (Module 20 §8 US-2) | Same-day, for anything the product's own audit trail already holds | Module 20 §3 |
| Access-review completion rate | % of scheduled access reviews (Module 21 §7.2) completed on time | 100% | Module 21 §21 |
| Segregation-of-duties override frequency | Count of logged SoD overrides (Module 21 §10) | Monitored, low-and-explained is healthy; a rising unexplained trend is a red flag | Module 21 §27's risk |

## User experience metrics

| Metric | Definition | Target | Traces to |
|---|---|---|---|
| Employee satisfaction with HR processes | Periodic pulse-survey question, tracked over time (Module 11) | Improving trend post-adoption | Market research's UX-differentiation thesis |
| Task-completion rate for key self-service flows | % of started leave applications / expense claims / etc. that reach submission (not abandoned) | ≥90% | Directly measures whether self-service UX is genuinely low-friction, per every competitor's named UX complaints in Phase 2 research |
| Support-response SLA adherence during payroll-close windows specifically | Whether support-ticket response times hold steady (not degrade) during the customer's own payroll-close period | No degradation vs. baseline — this is **the single most evidenced, most differentiating metric in this entire document**, given market research §5's finding that every one of the 8 competitors researched shows support-quality complaints, most acutely during the vendor's own peak periods (Darwinbox specifically) | [03-product-vision.md](03-product-vision.md)'s central positioning claim |
| Accessibility conformance | WCAG 2.2 AA automated + manual audit pass rate | 100% for critical user journeys, tracked per [11-non-functional-requirements.md](11-non-functional-requirements.md) §7 | [00-existing-system-audit.md](00-existing-system-audit.md) §8 |

## Business metrics

| Metric | Definition | Target | Traces to |
|---|---|---|---|
| Customer retention | Annual logo/revenue retention rate | Industry-typical-or-better — no specific figure asserted without a commercial/pricing model decided (OQ-20, [03-product-vision.md](03-product-vision.md)) | Business-model dependent |
| Customer support volume | Tickets raised by customer administrators (distinct from the employee-facing HR-ticket metric above — this is the *vendor's own* support load) | Declining trend as product matures/documentation improves | General SaaS-operations health |
| Implementation time | Time from signup to Foundation-Release-equivalent "live" status | Fast, self-serve-capable for the SMB/mid-market ICP, per Module 22 §3's guided-setup design goal | Module 22 §3 |
| Customer satisfaction (CSAT/NPS) | Standard survey instrument | Tracked over time, no fixed initial target | General business health |

## Technical metrics

| Metric | Definition | Target | Traces to |
|---|---|---|---|
| System availability | Per [11-non-functional-requirements.md](11-non-functional-requirements.md) §1 | 99.9% (initial assumption) | NFRs |
| API/list-page performance | Per [11-non-functional-requirements.md](11-non-functional-requirements.md) §3 | Per that document's targets | NFRs |
| Audit-log completeness | % of state-mutating actions with a corresponding audit record (should be 100% by design, measured to catch any implementation gap) | 100% | [10-security-privacy-audit.md](10-security-privacy-audit.md) §13 |
| Backup-restore success rate | % of scheduled backup-restore tests that succeed | 100% | [10-security-privacy-audit.md](10-security-privacy-audit.md) §15's "verified-restorable" requirement |

---

## Open questions

- Several targets above (customer retention, CSAT) are explicitly deferred pending a commercial/pricing-model decision (OQ-20) — these should be revisited once that decision is made, not treated as final.
- Whether the "support-response SLA during payroll-close" metric requires a dedicated payroll-window support-staffing model (a commercial/operations decision, not a product-requirements one) is flagged as a direct dependency of this metric's own achievability — the metric is meaningful only if the business commits to the underlying operational practice it measures.
