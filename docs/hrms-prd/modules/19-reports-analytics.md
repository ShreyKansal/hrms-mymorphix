# Module 19 — Reports and Analytics

**Status:** Draft v1 (pending stakeholder review) · **Release:** HR Operations (standard reports) / Enterprise (custom report builder, predictive analytics)
**Depends on:** every data-owning module; Module 21 (Roles and Permissions — the primary constraint on this module's design)

---

## 1. Module overview

This module is the reporting/analytics **engine and dashboard framework** — standard reports, a custom report builder, role-based dashboards, scheduling, drill-down, and export. It does not itself define every individual report's content; the full report inventory (name, purpose, fields, filters per report) lives in [12-report-catalogue.md](../12-report-catalogue.md) as a companion phase document. This module defines the *capability* those reports are built on.

## 2. Problem statement

Phase 2 research found reporting to be a genuine, recurring weak point even among otherwise-strong competitors: Darwinbox's own reviewers call its report builder "powerful but not intuitive"; RazorpayX reviewers specifically cite "report generation limitations"; BambooHR's reporting is described as "basic at scale," a named reason companies outgrow it. Meanwhile Rippling's cross-domain (HR+IT+Finance) reporting via its Employee Graph is the single most differentiated reporting architecture found in the entire research set.

## 3. Business objective

Give every persona a role-appropriate dashboard by default (not a blank slate requiring self-assembly), and give power users a genuinely intuitive custom-report builder — directly targeting the "powerful but not intuitive" gap found against Darwinbox — with permission enforcement (masking, scope) applied consistently regardless of which report or dashboard a user is viewing.

## 4. User personas

Every persona consumes at least one dashboard (per [04-personas-and-roles.md](../04-personas-and-roles.md)'s persona-specific "Reporting requirements" sections). Primary builders/configurers: **HR Administrator**, **System Administrator** (dashboard/report configuration). Primary consumers: all others, per their own scoped view.

## 5. User needs

Every persona needs a dashboard that answers their specific questions by default, not a generic one requiring customisation before it's useful. Power users (HR Administrator, Finance User) need to build genuinely custom reports without needing IT/vendor support — directly responding to the market research finding that reporting customisation is a recurring competitor pain point.

## 6. Primary use cases

View role-based dashboard (Employee, Manager, HR Operations, Payroll, Recruitment, Finance, Leadership, System Administration — per the brief's explicit list); build a custom report (drag-and-drop fields, filters, grouping); save and share a custom view; schedule a report for recurring delivery; drill down from a summary metric to underlying records (respecting permission scope); export in multiple formats.

## 7. Detailed workflows

### 7.1 Custom report building

- **Trigger:** A user with report-builder access (typically HR Administrator, Finance User, or a persona granted this capability) wants a report not covered by a standard/prebuilt one.
- **Steps:** 1) User selects a base data domain (Employee, Attendance, Leave, Payroll, Recruitment, etc. — cross-module reports, e.g., "headcount cost by department," require the builder to join across domains, a genuinely harder capability than single-module reporting and the specific area competitor research flags as weak) 2) User selects fields, applies filters, chooses grouping/aggregation 3) System enforces the user's actual permission scope at query time — **a report builder must never become a permission-bypass mechanism** (a user cannot build a report that surfaces data they wouldn't otherwise have access to, field-masking and record-scoping apply identically whether viewing a record directly or via a custom report) 4) User previews, refines, saves (privately or shared, per Module 21 sharing permissions) 5) Optionally schedules for recurring delivery (Module 18 notification integration).
- **Decision points:** Cross-domain joins that would be prohibitively slow at scale (Phase 12 NFR concern) may need to be pre-aggregated/materialised rather than computed live on every view — a genuine technical design consideration flagged here for architecture, not resolved in this PRD.
- **Audit events:** `ReportCreated`, `ReportExported` (export specifically logged given data-sensitivity/bulk-download-monitoring requirements, Phase 11).

## 8. User stories

**US-1**
As an **HR Administrator**, I want to build a cross-module report (e.g., headcount by department joined with attrition rate) without needing IT/vendor help, so that ad hoc analysis doesn't become a support ticket — directly addressing the Darwinbox "powerful but not intuitive" and BambooHR "outgrow it at scale" complaint patterns found in Phase 2 research.
**Acceptance criteria:** Given a report combining Employee and Separation data by department, when built through the report builder, then it correctly reflects each department's current headcount and trailing-12-month attrition without requiring a database query written by an engineer.

**US-2**
As a **Finance User**, I want to drill down from an aggregate payroll-cost number to the underlying cost-centre breakdown, without seeing individual employees' compensation unless I'm separately entitled to that detail.
**Acceptance criteria:** Given a Finance User views an aggregate payroll-cost dashboard, when they drill down, then they reach cost-centre-level detail but the system blocks further drill-down into individual compensation line items unless their role explicitly grants that (per Module 21, and per [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 8's default-restriction note) — permission enforcement holds at every level of drill-down, not just the top-level dashboard.

## 9. Functional requirements

Standard/prebuilt reports (content defined in [12-report-catalogue.md](../12-report-catalogue.md)); custom report builder with cross-module join capability (§7.1); saved views (private and shared); dashboard builder; role-based default dashboards for Employee, Manager, HR Operations, Payroll, Recruitment, Finance, Leadership, System Administration (per the brief's explicit persona-dashboard list); scheduled report delivery (Module 18); export (PDF/CSV/XLSX at minimum); drill-down with permission enforcement at every level (§8 US-2); filters; cross-module reporting; headcount/attrition/diversity/attendance/leave/payroll/recruitment/performance/engagement/cost analytics (content in [12-report-catalogue.md](../12-report-catalogue.md)); trend analysis (time-series, not just point-in-time snapshots); data-freshness indicators (so users know if they're looking at real-time or last-night's-batch data — an honesty/trust feature, not just a technical footnote); access-controlled reporting; PII masking in reports (consistent with Module 1 §12's field-level masking, applied identically here).

## 10. Business rules

Permission enforcement in reports/dashboards must be identical in strictness to direct record access — no report or dashboard is a "back door" around Module 21's scoping rules (§7.1's core design principle, restated as a business rule because of how easily this gets violated in practice if reporting is built as a separate, less-carefully-permissioned subsystem).

## 11. Validation rules

A saved report shared beyond its creator must pass a permission-sanity check at share-time (can the intended audience actually see the underlying data, given their own scope) — sharing a report doesn't grant new access, it only works for recipients who already have equivalent access, which the system should make clear rather than silently producing an empty/broken report for an under-permissioned recipient.

## 12. Permission requirements

This module's entire design is downstream of Module 21 — see §10. Additionally: report-builder access itself (the capability to create *new* custom reports, distinct from viewing existing ones) is a specific, grantable permission, not implied by general module access.

## 13. Approval workflows

Not typically applicable — reporting is a read/consumption activity; the one exception is potentially requiring approval before a report can be marked "shared org-wide" given the aggregation/sensitivity risk of a poorly-scoped shared report (tenant-configurable, not assumed mandatory).

## 14. Statuses and state transitions

**Scheduled report:** Active → Paused → (recipient/schedule change) → Active, or Cancelled. Not otherwise a state-machine-heavy module.

## 15. Record detail-page requirements

Each dashboard (per persona, §9) is itself a primary "page" of this module — see [07-information-architecture.md](../07-information-architecture.md) for placement. Custom-report builder interface: field picker, filter builder, preview pane, save/share/schedule actions.

## 16. Search, filter and sorting requirements

Report/dashboard library searchable by name/owner/domain; within any given report, standard filter/sort per the report's defined fields.

## 17. Bulk-action requirements

Bulk report-sharing/permission updates (e.g., re-sharing a set of reports after a reorg changes who should see departmental data).

## 18. Import and export requirements

Report/dashboard-definition export/import (portability across sandbox/production or multi-org contexts, same pattern as Module 17 §18); data export per report (§9).

## 19. Notification requirements

Scheduled-report delivery via Module 18; report-ready notifications for long-running report generation (Phase 12 NFR — some cross-module/large-scale reports may not be instant, and the user should be notified rather than left staring at a spinner or assuming failure).

## 20. Mobile requirements

Dashboard *viewing* (especially Leadership's glanceable executive summary, per [04-personas-and-roles.md](../04-personas-and-roles.md) Persona 10) should work well on mobile; report *building* is a desktop-appropriate, complex-interaction task not prioritised for mobile.

## 21. Reporting requirements

This module *is* the reporting-requirements infrastructure — see §9; the specific report inventory lives in [12-report-catalogue.md](../12-report-catalogue.md).

## 22. Audit-log requirements

Every custom-report creation, every export (bulk-download-monitoring relevant, Phase 11), every sharing-permission change — logged per Phase 11.

## 23. Integration requirements

Reads from every data-owning module; Module 18 (scheduled-delivery), Module 21 (permission enforcement, the module this one is most tightly coupled to).

## 24. Error, empty, and edge cases

**Error states:** a cross-module report query that times out at scale (Phase 12 NFR concern — should fail gracefully with a clear message and a suggestion to narrow scope, not hang indefinitely). **Empty states:** a new tenant with insufficient data-history for trend reports (e.g., attrition trend needs multiple periods of data) — should clearly indicate "insufficient history yet" rather than a misleading flat/zero trend line. **Edge cases:** a report saved by a user who is later separated (Module 15) — ownership/access should transfer or the report should be clearly flagged as orphaned, not silently break for its remaining viewers.

## 25. Acceptance criteria

Given two users with different permission scopes both view the same shared dashboard, when they each load it, then each sees only the data their own scope entitles them to — the same dashboard definition legitimately renders different actual data per viewer, which must be true by design, not an edge case to patch later.

## 26. Dependencies

Module 21 (the module this one is most fundamentally dependent on), Module 18, and every data-owning module.

## 27. Risks

Reporting-permission enforcement is exactly the kind of cross-cutting concern that's easy to get right in the common case and wrong in an edge case (a drill-down path, an export, a shared-report recipient) — this deserves dedicated security-review attention (Phase 11) specifically because reporting aggregates and surfaces data in ways that can inadvertently create a privacy/permission leak even when every individual module's own access control is correct.

## 28. Open questions

Should real-time vs. batch/near-real-time data freshness be a single product-wide choice, or configurable per report given the performance-vs-freshness tradeoff (Phase 12 NFRs)? Recommend per-report/per-domain configurability with the freshness indicator (§9) always visible — flagged for architecture design, not decided here.

## 29. Release scope

**MVP:** standard/prebuilt role-based dashboards (per persona), basic filtering/export, scheduled delivery.
**Later phase:** full custom cross-module report builder (§7.1), predictive/AI-assisted analytics (Module 25), advanced drill-down UX.
**Out of scope:** this module does not become a general-purpose BI tool connecting to arbitrary external data sources — it's scoped to this product's own data domains, consistent with [03-product-vision.md](../03-product-vision.md) Product Boundaries.
