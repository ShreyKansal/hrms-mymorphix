# 11 — Non-Functional Requirements

**Status:** Draft v1 (pending stakeholder review — all numeric targets below are **explicitly labelled initial assumptions**, per the brief's own instruction, not validated commitments)
**Last updated:** 2026-07-23

---

## 1. Availability

**Initial assumption:** 99.9% uptime target for core modules (Employee records, Attendance, Leave, ESS/MSS) — payroll-processing windows (Module 6) warrant even tighter reliability during the specific days/hours a tenant's payroll cycle runs, given the financial/legal consequence of a processing failure at that moment (Module 6 §27's named risk). **Needs stakeholder validation**, not asserted as a contractual SLA by this PRD.

## 2. Reliability

Critical employee and payroll changes must never be silently lost (per the brief's explicit principle) — this translates concretely into: no fire-and-forget writes for anything touching Employment Assignment, Compensation, or Payroll Run state; every mutation either succeeds and is confirmed, or fails visibly with a clear error, never a silent partial/ambiguous outcome (a recurring theme across nearly every module's own §24 error-handling requirements).

## 3. Performance

**Initial assumption targets** (all pending validation): standard list-page queries (Module 1's directory, Module 5's leave list) return within 2 seconds at the 95th percentile for a tenant with up to 10,000 employees; the Attendance Record table's high-write-volume queries ([08-conceptual-data-model.md](08-conceptual-data-model.md) §5) specifically need dedicated performance-testing attention given their scale (thousands of employees × daily records) rather than being assumed to perform adequately by default.

## 4. Scalability

Architecture should support growth from a 50-person MVP customer to a 10,000+-employee enterprise customer on the same product (not a re-platforming event) — directly consistent with Product Principle 9 ([03-product-vision.md](03-product-vision.md)): "the interface should remain usable even when the organisation has thousands of employees," explicitly contrasted against the BambooHR "outgrow it at 150-200 employees" and Darwinbox "very large enterprises need more customisation" competitor gaps found in Phase 2 research.

## 5. Maintainability

Statutory/compliance rules (Module 6 §10, Module 10 §10) are versioned configuration, not hard-coded logic requiring a deployment to change — this is as much a maintainability requirement as a functional one, directly targeting the "regulatory change lag" risk named in [04-personas-and-roles.md](04-personas-and-roles.md) Persona 7's pain points.

## 6. Observability

Every module's audit-log requirements (§22 sections throughout) feed a broader observability requirement: system health (Module 22 §21), integration health (Module 23 §15), and workflow-execution health (Module 17 §21's bottleneck reporting) should all be genuinely monitorable in production, not just logged-and-forgotten — directly supporting [14-success-metrics.md](14-success-metrics.md)'s technical metrics.

## 7. Accessibility

**Target: WCAG 2.2 AA**, per the brief's own suggestion — explicitly noted in [00-existing-system-audit.md](00-existing-system-audit.md) §8 as **this product's own commitment**, not an inherited guarantee from the Atlaskit design system (which provides accessible components but explicitly states end-to-end conformance is the building team's responsibility). Atlaskit's own documented accessibility principles (reading-level target ages 12-14, 4.5:1/3:1 contrast minimums, semantic HTML) are directly adoptable as this product's own baseline, per [00-existing-system-audit.md](00-existing-system-audit.md) §8.

## 8. Responsiveness

The 6-tier breakpoint system (xxs 320px through xl 1768px+) confirmed in [00-existing-system-audit.md](00-existing-system-audit.md) §9 is the binding responsive-design specification for every module's list/detail pages, per [07-information-architecture.md](07-information-architecture.md) §1.

## 9. Browser support

**Initial assumption:** current and prior major version of Chrome, Edge, Safari, Firefox — **needs stakeholder validation** against the actual target customer base's real-world browser distribution (India-market SMB/mid-market IT environments can skew toward older browser versions more than a global-average assumption would suggest, worth an explicit check rather than assuming a generic modern-browser baseline).

## 10. Mobile support

Per Module 24's full specification — the deliberately-scoped subset of high-frequency actions, not full feature parity (Product Principle 10).

## 11. Data consistency

Given this product's core differentiation claim (a unified, not one-way-synced, data model — [03-product-vision.md](03-product-vision.md)), data consistency across modules is a first-order NFR, not an implementation detail: Employment Assignment changes must be immediately consistent for any module reading current org structure (no eventual-consistency lag that could, e.g., let an approval route to a manager who was just changed a moment ago) — though genuinely async, eventually-consistent patterns (e.g., a report-builder's materialised cross-module joins, [09-api-and-event-planning.md](09-api-and-event-planning.md) §12) are acceptable *with* the explicit data-freshness indicator required in Module 19 §9.

## 12. Backup

Per [10-security-privacy-audit.md](10-security-privacy-audit.md) §15 — regular, *verified-restorable* backups, not just configured ones.

## 13. Disaster recovery

**Initial assumption targets** (pending validation): RPO (Recovery Point Objective) of no more than 1 hour, RTO (Recovery Time Objective) of no more than 4 hours for core modules — payroll-processing-window RTO should arguably be tighter given the time-sensitivity of a payroll cycle in progress, flagged as a scenario worth its own specific target rather than a single blanket number.

## 14. Import performance

Bulk employee import (Cross-Module Workflow #22) should complete validation-and-preview for at least several thousand rows within a reasonable interactive-feeling window (specific target **pending validation**), with the async-job pattern ([09-api-and-event-planning.md](09-api-and-event-planning.md) §13) applied for larger imports rather than a synchronous, timeout-risking request.

## 15. Export performance

Same async-job pattern for large exports (Module 19's report exports, Module 6's payroll register) — per [09-api-and-event-planning.md](09-api-and-event-planning.md) §12.

## 16. Search performance

Employee-directory and global search ([07-information-architecture.md](07-information-architecture.md) §7) should return typeahead results within a few hundred milliseconds at the scale target in §4 — a genuinely important perceived-performance requirement given how frequently this surface is used across nearly every persona.

## 17. Report-generation performance

Cross-module custom reports (Module 19 §7.1) may be legitimately slower than single-module standard reports given their join complexity — the honest answer here is the data-freshness/async-job pattern (§11, [09-api-and-event-planning.md](09-api-and-event-planning.md) §13), not a uniform fast-everything promise that would be dishonest about genuine cross-domain query cost.

## 18. Payroll-processing performance

**Initial assumption:** a full payroll run (preview + statutory calculation) for up to several thousand employees should complete within a reasonably bounded window (specific target **pending validation** with a qualified payroll/performance-engineering stakeholder) — this directly affects Module 6's usability during the tight payroll-close window several personas depend on.

## 19. Concurrent users

**Initial assumption:** the product should support the realistic concurrent-usage pattern of an enterprise customer's full workforce checking in within a tight morning-arrival window (a genuine, predictable peak-load pattern for Module 4 specifically) without degradation — flagged as a specific, named load-testing scenario rather than a generic "handle concurrent users" statement.

## 20. Large employee datasets

Per §4/§16 — the product's usability guarantee explicitly extends to thousands-of-employees-scale datasets, not just small/mid customers, per Product Principle 9.

## 21. Multi-location operations

Holiday calendars, PT/LWF state-variance (Module 6 §9), and geo-fencing (Module 4 §9) must all correctly handle a single tenant operating across many Indian states simultaneously — a realistic, common scenario for the target ICP ([03-product-vision.md](03-product-vision.md)), not an edge case.

## 22. Internationalisation and localisation

Architected for future multi-country expansion ([03-product-vision.md](03-product-vision.md)) even though MVP is India-only — string externalisation (i18n-ready UI text) and locale-aware formatting (§23/§24 below) should be built in from the start even if only English/India-locale is shipped at MVP, since retrofitting i18n after the fact is considerably more expensive than building it in from day one.

## 23. Time zones

India-only MVP means a single time zone (IST) is sufficient for correctness at launch, but the underlying data model (timestamps stored in a zone-aware format, not naive local time) should not assume single-time-zone operation permanently, given the multi-country-readiness mandate — directly relevant to Module 4 §28's open question about local-time-vs-home-base-time for travelling employees, which already surfaces a real, if narrow, multi-time-zone need even within India-only MVP (business travellers).

## 24. Date and currency formats

India-locale defaults (DD/MM/YYYY, ₹ with Indian numbering conventions — lakh/crore grouping, not just Western thousand-separators) as the MVP default, with the formatting layer built to be locale-configurable rather than hard-coded to Indian conventions, again per the multi-country-readiness mandate.

## 25. Language support

**Initial assumption:** English as the MVP UI language, with the underlying architecture (i18n-ready string externalisation, §22) not precluding additional Indian-language support (Hindi and others) as a validated later-phase investment based on actual customer demand — **not asserted as an MVP commitment**, flagged for Product stakeholder prioritisation.

---

## Summary table of initial-assumption numeric targets (all pending stakeholder validation)

| Area | Initial assumption | Validation needed from |
|---|---|---|
| Core-module availability | 99.9% | Infra/SRE stakeholder |
| List-page performance (95th percentile, ≤10K employees) | ≤2 seconds | Performance-engineering stakeholder |
| RPO | ≤1 hour | Infra/SRE stakeholder |
| RTO | ≤4 hours (tighter during active payroll windows) | Infra/SRE stakeholder |
| Payroll-run processing time (several thousand employees) | Bounded, reasonable window — exact figure not asserted | Payroll/performance-engineering stakeholder jointly |
| Search/typeahead latency | Few hundred milliseconds | Performance-engineering stakeholder |

## Open questions

- Every numeric target above is explicitly an initial assumption per the brief's own instruction — the overarching open question is simply: **who is the appropriate stakeholder to validate each, and when does that validation happen relative to architecture-phase kickoff** (a process question for whoever owns the transition from this PRD to technical design, not resolved here).
