# Build Guide — Module 19: Reports and Analytics

**Full spec:** [modules/19-reports-analytics.md](../../hrms-prd/modules/19-reports-analytics.md), report content list in [12-report-catalogue.md](../../hrms-prd/12-report-catalogue.md).
**Phase:** basic role-based dashboards can (and should) actually start earlier — build a simple version alongside each phase's modules rather than waiting for Enterprise. The **custom cross-module report builder** specifically is the Enterprise-phase piece.

---

## What this module is, in one paragraph

Dashboards per persona (Employee, Manager, HR Ops, Payroll, Recruitment, Finance, Leadership, System Admin) plus, eventually, a self-service report builder. The one rule that matters more than any chart library choice: **a report can never show someone data they couldn't otherwise see.** If a Finance user can't normally see individual compensation, they can't see it via a report either — no exceptions, no "just this once for a dashboard."

## Screens to build

1. **Standard Dashboards** (one per persona, per [12-report-catalogue.md](../../hrms-prd/12-report-catalogue.md)) — build these incrementally as each module ships, don't save them all for the end.
2. **Custom Report Builder** (Enterprise phase) — pick a data domain (or multiple, for a cross-module report), pick fields, filter, group. Run every query through the exact same permission check used everywhere else in the product (reuse Module 21's Guard/scope logic — do not write a second, separate permission check for reporting, that's how leaks happen).
3. **Saved Views** — save and optionally share a report configuration.
4. **Scheduled Delivery** — recurring report emails (via Module 18).

## Key idea: permission enforcement holds at every level, including drill-down

If a user drills from an aggregate number into the underlying records, that drill-down still has to pass the same permission check as viewing those records directly. Build the query layer so this is automatic (e.g., every report query gets the same tenant/scope filter injected as any other API call), not something each report author has to remember.

## Data model

`report_definitions` (saved custom reports — domain(s), fields, filters, sharing scope). No new business data — this module reads from everywhere else.

## API endpoints

```
GET   /api/v1/dashboards/:persona           — pre-built dashboard data
GET/POST  /api/v1/report-definitions
POST  /api/v1/reports/run                    — execute a report definition, permission-filtered
POST  /api/v1/reports/schedule
```

## What "done" looks like

- Two users with different permission scopes view the same shared dashboard — confirm each sees only their own entitled data, not identical data.
- Build a cross-module report (e.g., headcount + attrition by department), confirm it runs without needing a hand-written SQL query from an engineer.
- Attempt to drill down past what a role is entitled to see (e.g., Finance drilling into individual compensation) — confirm it's blocked at the same level as a direct API call would be.
