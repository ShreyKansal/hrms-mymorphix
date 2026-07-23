# HR Operations Phase — Ticket Backlog

**Status:** PM-proposed. Same format as [foundation-phase-backlog.md](foundation-phase-backlog.md) — paste into your tracker of choice.
**Source:** the 10 build guides in [../build-guides/](../build-guides/) for this phase.
**Recommended build order:** Onboarding → Attendance → Leave → ESS/MSS (needs the three prior) → Documents → Helpdesk → Policy/Compliance → Separation (needs Documents + ideally Assets) → POSH → Mobile (needs Attendance/Leave/ESS-MSS web versions done first).

---

## Epic 7: Employee Onboarding (Module 3)

| Story | Description | Points |
|---|---|---|
| Prisma schema: onboarding checklists, tasks, templates | | 5 |
| Shared `ChecklistSection` component | Build reusable — Module 15 needs the identical shape later | 5 |
| Preboarding Portal (mobile-friendly) | Document upload, form fill, e-sign placeholder | 8 |
| Onboarding Dashboard (HR) | Progress + at-risk flagging | 5 |
| Checklist Detail page | Sectioned by owner (HR/IT/Finance/Manager/Employee) | 5 |
| Document verification flow | Approve/reject with reason | 3 |
| Draft→Active activation logic | Configurable completion threshold | 3 |
| Deferred-joining date-shift logic | Recalculates all task due dates | 3 |
| No-show/archive path | | 2 |
| Checklist Template Editor (admin) | | 5 |
| **Epic total** | | **44** |

## Epic 8: Attendance (Module 4)

| Story | Description | Points |
|---|---|---|
| Prisma schema: attendance_records, attendance_punches, regularisation_requests | Index on `(employee_id, date)` | 5 |
| Check-in/out API + widget (web) | | 5 |
| Shift/holiday-calendar/policy config screens | | 8 |
| My Attendance calendar view | Custom component | 8 |
| Regularisation request + approval flow | Routes through Module 17 | 5 |
| Team Attendance Calendar (manager) | | 5 |
| Monthly lock screen + lock action | | 5 |
| Performance test at scale | Thousands of employees × a year of records | 5 |
| **Epic total** | | **46** |

## Epic 9: Leave Management (Module 5)

| Story | Description | Points |
|---|---|---|
| Prisma schema: leave_types, leave_policies, leave_balances, leave_requests | | 5 |
| Apply for Leave form + balance check | | 5 |
| My Leave screen | | 3 |
| Approval flow (Module 17 integration) + team calendar inline | | 5 |
| Leave Policy config screens | Accrual/carry-forward/encashment rules as data, not code | 8 |
| Monthly accrual background job | Proration for mid-month joiners | 5 |
| Year-end closure: preview + commit | | 8 |
| **Epic total** | | **39** |

## Epic 10: ESS/MSS (Module 16)

| Story | Description | Points |
|---|---|---|
| Employee Home dashboard (aggregation) | | 5 |
| Manager Home + Team Overview | | 5 |
| Unified Approval Inbox | Calls Module 17's generic pending-approvals endpoint | 8 |
| Graceful-degradation handling | One module down doesn't break the whole homepage | 3 |
| Employee/Manager context switcher | For users who are both | 2 |
| **Epic total** | | **23** |

## Epic 11: Documents and Letters (Module 13)

| Story | Description | Points |
|---|---|---|
| Prisma schema: templates (versioned), generated_documents | | 5 |
| Template editor + placeholder variables | | 8 |
| Template preview with sample data | | 3 |
| Template approval workflow | | 3 |
| Triggered generation API | Called from Module 1/6/15 | 5 |
| Document Repository tab (in Module 1's Employee Detail) | | 3 |
| **Epic total** | | **27** |

## Epic 12: Helpdesk (Module 12)

| Story | Description | Points |
|---|---|---|
| Prisma schema: tickets, kb_articles, deflection_events | | 5 |
| KB search + deflection flow | The screen that appears before ticket creation | 5 |
| Ticket creation + HR queue | | 5 |
| Ticket detail: conversation + internal notes (verify separation) | | 5 |
| SLA timer with pause-on-employee-response | | 5 |
| **Epic total** | | **25** |

## Epic 13: Policy and Compliance (Module 20)

| Story | Description | Points |
|---|---|---|
| Prisma schema: policies, policy_versions, policy_acknowledgements (version-specific) | | 5 |
| Policy Library (employee) + acknowledgement action | | 5 |
| Policy Management + versioning + applicability targeting | Reuse Module 2/1 targeting logic | 5 |
| Acknowledgement Status screen | | 3 |
| Auto-enrollment for newly-in-scope employees | | 5 |
| Compliance Calendar | | 5 |
| **Epic total** | | **28** |

## Epic 14: Separation and Offboarding (Module 15)

| Story | Description | Points |
|---|---|---|
| Prisma schema: separations, access_revocation_events | | 5 |
| Resignation + HR-initiated separation flows | | 5 |
| Notice-period reconciliation (waive/recover) | | 5 |
| Exit checklist (reuse `ChecklistSection`) | Including asset-recovery pull from Module 14 | 5 |
| Access-revocation scheduled job + confirmation tracking | **Test explicitly, this is the highest-stakes piece** | 8 |
| Resignation withdrawal path | | 3 |
| Separations Dashboard | | 3 |
| **Epic total** | | **34** |

## Epic 15: POSH / IC Case Management (Module 26)

| Story | Description | Points |
|---|---|---|
| Prisma schema: ic_composition, posh_cases + confidential content tables (consider separate schema) | | 5 |
| **Dedicated IC-membership access Guard** (separate from Module 21's general Guard) | The most important story in this epic — get this reviewed carefully | 8 |
| Complaint intake screen (separate from Module 12) | | 5 |
| IC Case Workspace | | 8 |
| Automatic recusal check | | 3 |
| Aggregate Compliance Dashboard (no drill-down) | | 3 |
| IC Composition management + eligibility validation | | 5 |
| Explicit access-control test suite | HR admin/System admin cannot reach case content, any path | 5 |
| **Epic total** | | **42** |

## Epic 16: Mobile Experience (Module 24)

| Story | Description | Points |
|---|---|---|
| React Native app scaffold | | 5 |
| Check-in/out with offline capture-and-sync | **Budget real time — this is the hard one** | 13 |
| Leave apply/status + Approval Inbox | | 8 |
| Payslip view (read-only) | | 3 |
| Expense submission with camera capture | | 5 |
| Directory search | | 3 |
| Push notifications with deep-linking | | 5 |
| **Epic total** | | **42** |

---

## Phase total

**~350 story points** across 10 epics. At the same rough velocity assumption as the Foundation phase (~40–50 points/sprint for this team size), that's **7–9 sprints**, consistent with the 10–12 sprint estimate in [01-project-execution-plan.md](../01-project-execution-plan.md) once you add buffer for acceptance-criteria hardening and the POSH module's extra review rigor.

**Sequencing note:** Epics 8 and 9 (Attendance, Leave) can run in parallel with separate engineers once Epic 7 (Onboarding) is underway, since they don't depend on each other. Epic 10 (ESS/MSS) should start only once at least Attendance and Leave have working APIs to aggregate. Epic 15 (POSH) can be built by a separate engineer in parallel with almost everything else in this phase — it barely touches other modules — but its access-control epic should get a dedicated security review before merge, not just a normal code review.
