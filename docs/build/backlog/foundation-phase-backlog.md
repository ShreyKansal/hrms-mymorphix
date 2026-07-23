# Foundation Phase — Ticket Backlog

**Status:** PM-proposed, ready to paste into Jira/Linear/whatever tool the team uses — organised as Epics → Stories, each story sized for one developer to pick up.
**Source:** derived from the Foundation-phase Module Build Guides in [../build-guides/](../build-guides/) and [01-project-execution-plan.md](../01-project-execution-plan.md).
**Estimates:** story points, Fibonacci-ish (1/2/3/5/8/13), rough planning estimates — recalibrate after Sprint 1 with real velocity.

---

## Epic 0: Infrastructure (Sprint 0)

| Story | Description | Points | Depends on |
|---|---|---|---|
| Monorepo scaffold | Turborepo, `apps/web` (React), `apps/api` (NestJS), `packages/shared-types`, `packages/ui-shared`, `packages/permissions` | 3 | — |
| Prisma schema: Tenant/Organisation/Legal Entity | Root tables only, with Row-Level Security policies | 5 | Monorepo |
| Two-tenant RLS proof test | Insert data for two tenants, confirm tenant A's queries structurally cannot see tenant B's rows | 3 | Schema |
| Basic email/password auth | Login/logout, argon2 hashing, JWT + refresh token in httpOnly cookies | 5 | Schema |
| CI pipeline | Lint, typecheck, unit tests on PR; deploy to staging on merge | 5 | Monorepo |
| **Epic total** | | **21** | |

## Epic 1: Employee Master (Module 1) — Sprints 1–2

| Story | Description | Points | Depends on |
|---|---|---|---|
| Prisma schema: `employees` table | All field groups per [modules/01](../../hrms-prd/modules/01-core-hr-employee-information.md) §9 | 3 | Epic 0 |
| Prisma schema: `employment_assignments` table | Effective-dated pattern, `(employee_id, effective_from)` index | 5 | Employees table |
| Prisma schema: `compensation` table | Same effective-dated pattern, separate from assignments | 3 | Employees table |
| `POST /employees` + Create Employee modal | Form with `@atlaskit/form` validation, government-ID uniqueness check | 5 | Schema |
| `GET /employees` + Directory list page | `@atlaskit/dynamic-table`, search, filters, pagination | 5 | Schema |
| `GET /employees/:id` + Employee Detail page shell | Header, tabs skeleton (Profile/Employment/Compensation/Documents/Assets/Timeline) | 5 | Schema |
| Profile tab | Personal info, contact, emergency contacts, dependants, nominees — view + edit | 5 | Detail page shell |
| Employment tab | Current assignment display + historical timeline (chronological cards, not a flat table) | 5 | Assignments table |
| `POST /employees/:id/assignments` + Transfer modal | Creates new assignment row, closes out the old one, reason-code required | 5 | Assignments table |
| Payroll-lock check on backdated transfers | Block standard transfer path if effective date falls in a locked period (stub the lock-check for now, Module 6 doesn't exist yet) | 2 | Transfer modal |
| Compensation tab | Permission-gated visibility (tab itself absent, not disabled, for unauthorised users) | 5 | Epic 2 (permission guard) |
| Timeline tab | Chronological audit feed across all changes to this employee | 5 | All above |
| Basic org chart view | Manager → reports tree, from live assignment data | 3 | Assignments table |
| **Epic total** | | **56** | |

## Epic 2: Roles and Permissions (Module 21) — Sprints 1–2, parallel with Epic 1

| Story | Description | Points | Depends on |
|---|---|---|---|
| Prisma schema: `roles`, `permissions`, `role_assignments` | Composable role+scope+expiry model per [modules/21](../../hrms-prd/modules/21-roles-permissions.md) §9 | 5 | Epic 0 |
| Permission-check Guard (NestJS) | The core enforcement layer — every controller runs through this | 8 | Schema |
| Scope resolution logic | "team" = live query against Module 1/2 org data, not a cached list; same for department/location/entity scopes | 8 | Guard, Epic 1 assignments table |
| Field-level masking | Compensation/bank/statutory-ID fields stripped from API responses for unauthorised roles | 5 | Guard |
| Roles list + Role Editor screens | Capability matrix UI | 5 | Schema |
| User → Role Assignment screen | Assign role + scope + optional expiry | 5 | Schema |
| Automatic expiry job | Scheduled job revokes access on expiry date, logs it | 3 | Role assignments |
| Segregation-of-duties conflict check | Block conflicting role combinations by default, with logged override path | 5 | Role assignment screen |
| My Effective Permissions diagnostic screen | Pick a user, see their combined resolved permissions | 3 | All above |
| Access Review report | Active grants, expiring-soon, override history | 3 | All above |
| **Epic total** | | **50** | |

## Epic 3: Organisation Management (Module 2) — Sprint 3

| Story | Description | Points | Depends on |
|---|---|---|---|
| Prisma schema: legal entities, departments, sub-departments, teams, locations, cost centres, grades/bands/designations | Per [modules/02](../../hrms-prd/modules/02-organisation-management.md) §9 | 5 | Epic 1 |
| Tenant Setup Wizard (minimal version) | Company name + one legal entity + one location | 5 | Schema |
| Departments CRUD screens | List + detail, with head-of-department field | 5 | Schema |
| Locations, Grades/Bands/Designations CRUD | Simple reference-data management screens | 5 | Schema |
| Richer org chart | Reporting-line default view + dotted-line overlay toggle | 5 | Epic 1 org chart |
| Reorg batch tool | Multi-select employees, preview, atomic commit, `reorg_event_id` tagging | 8 | Epic 1 transfer logic |
| **Epic total** | | **33** | |

## Epic 4: Workflow and Approval Engine (Module 17) — Sprint 4

| Story | Description | Points | Depends on |
|---|---|---|---|
| Prisma schema: `workflow_definitions`, `workflow_instances`, `workflow_steps` | Per [modules/17](../../hrms-prd/modules/17-workflow-approval-engine.md) §9 | 5 | Epic 2 |
| Workflow event API + rule matching | `POST /workflow-events`, matches trigger+conditions to a definition | 8 | Schema |
| Live approver resolution | "current manager" resolved fresh against Module 1/2 data every time | 5 | Epic 1/3 |
| Sequential + parallel chain execution | The two most common chain types first; any-one/all-must-approve can follow | 8 | Rule matching |
| Inactive-approver re-routing | Auto-escalate up the management chain if an approver is inactive/separated | 5 | Chain execution |
| Workflow Editor screen | Trigger/conditions/chain-type/approver-rule configuration UI | 5 | Schema |
| Simulation panel | Test a rule against sample data without creating a real instance | 5 | Editor |
| Bare-bones approve/reject UI | Placeholder until Module 16 builds the real unified inbox | 3 | Chain execution |
| **Epic total** | | **44** | |

## Epic 5: Notifications (Module 18) — Sprint 5

| Story | Description | Points | Depends on |
|---|---|---|---|
| Prisma schema: `notifications`, `notification_preferences` | Per [modules/18](../../hrms-prd/modules/18-notifications-communication.md) §9 | 3 | Epic 0 |
| Notification dispatch API | Priority-aware channel resolution (critical overrides narrowed preference) | 5 | Schema |
| Email provider integration | Transactional email sending | 3 | Dispatch API |
| Notification Centre UI | Top-nav dropdown, read/unread, click-through | 5 | Dispatch API |
| Preferences screen | Category × channel matrix | 3 | Dispatch API |
| Critical-notification-failure alerting | If every channel fails for a critical notification, alert an admin | 3 | Dispatch API |
| **Epic total** | | **22** | |

## Epic 6: System Administration (Module 22) — Sprint 5, parallel with Epic 5

| Story | Description | Points | Depends on |
|---|---|---|---|
| SSO (SAML/OIDC) integration | At least one identity provider | 8 | Epic 0 auth |
| MFA (TOTP) | Authenticator-app based | 3 | Epic 0 auth |
| Custom Fields (simple version) | Add a field to the Employee form without a code change | 5 | Epic 1 |
| Numbering Schemes config | Employee ID format configuration | 2 | Epic 1 |
| Calendars (financial/leave year, holidays) | Setup screens | 3 | Epic 3 (locations) |
| CSV Data Import | Column mapping, validation-preview, async job, error report | 8 | Epic 1 |
| **Epic total** | | **29** | |

---

## Sprint-by-sprint total (rough capacity check)

| Sprint | Epics | Points | Notes |
|---|---|---|---|
| 0 | Infrastructure | 21 | |
| 1–2 | Employee Master + Roles/Permissions (parallel) | 56 + 50 = 106 | Split across 2 backend + frontend engineers over 2 sprints — recalibrate after Sprint 1 |
| 3 | Organisation Management | 33 | |
| 4 | Workflow Engine | 44 | |
| 5 | Notifications + System Admin (parallel) | 22 + 29 = 51 | |
| 6–8 (buffer) | Field-masking depth, audit-log completeness, acceptance-criteria bug pass | Unestimated — budget real time here, not slack | |

**Total estimated: ~255 points across Sprints 0–5**, before the buffer sprints. If a two-week sprint with this team size realistically delivers ~40–50 points, that's roughly 5–6 sprints for the core build plus 2–3 buffer sprints — consistent with the 6–8 sprint estimate in [01-project-execution-plan.md](../01-project-execution-plan.md). **Treat this arithmetic as a sanity check, not a commitment — replace with real velocity after Sprint 1.**
