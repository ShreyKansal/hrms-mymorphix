# 12 — Report Catalogue

**Status:** Draft v1 (pending stakeholder review)
**Last updated:** 2026-07-23
**Depends on:** Module 19 (the reporting engine this catalogue's reports are built on), every module's own §21 reporting requirements
**Scope note:** this is the content catalogue; Module 19 is the capability/engine it runs on — read both together.

All reports below inherit Module 19 §10's permission-enforcement rule (identical strictness whether viewed directly or via a report) and Module 19 §9's data-freshness-indicator requirement. "Sensitive data" column flags reports needing field-masking/aggregation per [10-security-privacy-audit.md](10-security-privacy-audit.md).

| Report | Purpose | Personas | Source module(s) | Key filters | Sensitive data | MVP / Later |
|---|---|---|---|---|---|---|
| Headcount | Current/trend headcount by org unit | HR Ops, Leadership, Finance | 1, 2 | Department, location, entity, date range | No | MVP |
| Joiners | New hires in period | HR Ops, Leadership | 1, 3 | Date range, department | No | MVP |
| Exits | Separations in period | HR Ops, Leadership | 15 | Date range, department, type | No | MVP |
| Attrition | Attrition rate/trend | HR Ops, Leadership | 15, 1 | Date range, department, voluntary/involuntary | No | MVP |
| Employee movement | Transfers/promotions/manager-changes over time | HR Ops | 1 | Date range, department, change type | No | Later |
| Employee demographics | Age/gender/tenure distribution | HR Ops, Leadership | 1 | Department, location | Aggregated only — no individual-level demographic export by default | MVP |
| Probation | Employees currently on probation, by end date | HR Ops, Managers | 1, 3 | Department, end-date range | No | MVP |
| Confirmation | Confirmation status/pending decisions | HR Ops, Managers | Cross-Module Workflow #14 | Department, due-date range | No | MVP |
| Attendance summary | Present/absent/leave breakdown | HR Ops, Managers | 4 | Department, location, date range | No | MVP |
| Late arrival | Late-arrival trend by employee/department | HR Ops, Managers | 4 | Department, date range | No | MVP |
| Overtime | Overtime hours/cost by employee/department | HR Ops, Payroll, Finance | 4, 6 | Department, date range | Cost figures — Finance-scoped per Module 19 §8 US-2 | MVP |
| Leave utilisation | Leave taken by type/department | HR Ops, Managers | 5 | Leave type, department, date range | No | MVP |
| Leave liability | Outstanding encashable balance (balance-sheet-relevant) | Finance, Leadership | 5 | Department, date range | No | Later |
| Payroll register | Full per-employee payroll detail for a run | Payroll | 6 | Run/period, department | High — compensation detail, strict Module 21 scoping | MVP |
| Payroll variance | Cycle-over-cycle and vs.-budget variance | Payroll, Finance | 6 | Run/period, department | High | MVP |
| Statutory deductions | PF/ESI/PT/LWF/TDS summary | Payroll, Compliance | 6 | Period, entity | Moderate (aggregated) | MVP |
| Cost-centre payroll | Payroll cost allocated by cost centre | Finance | 6 | Cost centre, period | Aggregated for Finance's default scope (Module 19 §8 US-2) | MVP |
| Salary revision | Compensation-revision history/summary | Payroll, HR Admin | 1, 6 | Department, date range | High | Later |
| Reimbursements | Expense-claim summary by category/department | Finance, HR Ops | 7 | Category, department, date range | No | MVP |
| Recruitment funnel | Conversion by pipeline stage | Recruitment | 8 | Requisition, date range | No | MVP |
| Time-to-hire | Days from requisition to hire | Recruitment, Leadership | 8 | Requisition, department, date range | No | MVP |
| Source effectiveness | Hire rate by candidate source | Recruitment | 8 | Date range, requisition | No | Later |
| Performance ratings | Rating distribution by cycle/department | HR Ops, Leadership, Dept Heads | 9 | Cycle, department | High — individual ratings restricted, distribution-level aggregation for broader audiences per Module 9 §12 | MVP |
| Goal completion | Goal-completion rate by cycle/department | HR Ops, Managers | 9 | Cycle, department | No | MVP |
| Training completion | Mandatory/elective completion rate | HR Ops, Compliance | 10 | Course, department, date range | No | MVP |
| Certification expiry | Upcoming certification expirations | HR Ops, Compliance | 10 | Department, expiry-date range | No | MVP |
| Engagement surveys | eNPS/survey results trend | HR Ops, Leadership | 11 | Survey, date range | High — individual-response anonymity enforced structurally per Module 11 §7.1, never exposed regardless of role | MVP |
| Helpdesk SLA | Ticket volume/resolution-time/SLA compliance | HR Ops | 12 | Category, date range | No | MVP |
| Asset assignment | Current/historical asset assignment | HR Ops, IT | 14 | Category, department, status | No | Later |
| Exit clearance | Exit-checklist completion status across modules | HR Ops | 15 | Date range, department | No | MVP |
| Audit activity | System-wide audit-log summary | Compliance/Audit, System Admin | 21, all | Module, date range, actor | High — read-only, Compliance/Audit-User-tier access per [04-personas-and-roles.md](04-personas-and-roles.md) Persona 12 | MVP |
| Role and permission changes | Permission-change history | Compliance/Audit, System Admin | 21 | Date range, user, role | High | MVP |
| Integration failures | Integration-health/failure-rate report | IT Admin, System Admin | 23 | Integration, date range | No | MVP |
| POSH compliance posture | IC composition validity, aggregate case-count/status, annual-report readiness — **never individual case content**, per Module 26 §10/§21's hard confidentiality rule | HR Administrator, Compliance/Audit User | 26 | Date range | High — structurally aggregate-only, no drill-down path exists regardless of role | MVP |
| Benefits enrollment completion | Open-enrollment completion rate by department | HR Administrator | 27 | Department, plan, enrollment cycle | No | MVP |
| Benefits cost | Employer-contribution cost by plan/department | Finance | 27 | Plan, department, period | Aggregated for Finance's default scope | MVP |

## Additional reports named in individual module PRDs, not separately itemised above

Diversity analytics (aggregated, Module 19 §9), trend-analysis views (time-series overlays on most reports above, Module 19 §9), compliance/audit-readiness summary (Module 20 §21), notification-delivery-success-rate (Module 18 §21, technical/operational rather than HR-facing), AI-capability usage/acceptance-rate (Module 25 §21, administrative), access-review reports (Module 21 §21), workflow approval-turnaround and bottleneck reports (Module 17 §21).

## Dashboards by persona (per the brief's explicit list — content composed from the reports above, structure defined in Module 19 §9/§15 and [07-information-architecture.md](07-information-architecture.md))

- **Employee dashboard:** own attendance/leave/payslip summary, pending actions (Module 16's Employee Home).
- **Manager dashboard:** team overview, unified approval inbox, team performance/goal status (Module 16's Manager Home).
- **HR Operations dashboard:** headcount, joiners/exits, attrition, probation/confirmation, helpdesk SLA.
- **Payroll dashboard:** current-run status, payroll register/variance, statutory-deduction summary.
- **Recruitment dashboard:** funnel, time-to-hire, requisition status.
- **Finance dashboard:** cost-centre payroll allocation, payroll variance, reimbursement summary, leave liability.
- **Leadership dashboard:** headcount/attrition/DEI/cost/engagement summary with drill-down, per [04-personas-and-roles.md](04-personas-and-roles.md) Persona 10's glanceable-executive-summary need.
- **System Administration dashboard:** system health, integration failures, usage/subscription status (Module 22 §21).

## Open questions

- Exact export-format support per report (PDF/CSV/XLSX, per the brief's list) — assumed uniform across all reports for MVP simplicity; flagged for confirmation this is sufficient versus needing report-specific format constraints (e.g., a statutory report needing a government-prescribed format, Module 6 §18).
- Report-scheduling default cadence options (daily/weekly/monthly) — a Module 18/19 configuration detail not resolved at the catalogue level here.
