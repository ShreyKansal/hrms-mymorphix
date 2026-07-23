# Talent Phase — Ticket Backlog

**Status:** PM-proposed. Same format as prior phases.
**Source:** the 5 build guides in [../build-guides/](../build-guides/) for this phase (08, 09, 10, 11, 27).

---

## Epic 22: Recruitment (Module 8)

| Story | Description | Points |
|---|---|---|
| Prisma schema: requisitions, candidates, applications, interviews, scorecards, offers | | 8 |
| Requisition + approval flow | | 5 |
| Job posting (career-site publish; external job-board sync deferred to Module 23) | | 5 |
| Candidate Pipeline (Kanban board) | | 8 |
| Resume upload/parsing | | 5 |
| Interview scheduling + structured scorecards | | 8 |
| Offer generation with Grade/Band validation | | 5 |
| Offer acceptance → Employee-conversion flow | **Zero manual re-entry, test explicitly** | 8 |
| Duplicate-candidate detection | | 3 |
| Recruitment funnel reporting (basic) | | 3 |
| **Epic total** | | **58** |

## Epic 23: Performance Management (Module 9)

| Story | Description | Points |
|---|---|---|
| Prisma schema: goals, review_cycles, performance_reviews | | 5 |
| Goals: set, cascade, update anytime | | 5 |
| Review forms with autosave | **Test the crash-recovery scenario explicitly** | 8 |
| Manager review queue (prioritized, not a flat dump) | | 5 |
| Calibration view (distribution comparison, adjustment tracked separately from original) | | 8 |
| Promotion-recommendation → Module 1 handoff | Routes through normal approval, no bypass | 3 |
| Performance History tab on Employee Detail | | 3 |
| **Epic total** | | **37** |

## Epic 24: Learning and Development (Module 10)

| Story | Description | Points |
|---|---|---|
| Prisma schema: courses, mandatory_training_rules, enrollments, certifications | | 5 |
| Course catalogue + self-enrollment | | 5 |
| Mandatory-training rule engine (config-driven) | Reuse targeting pattern from Module 20 | 5 |
| Auto-enrollment triggers from Module 1/3 events | | 5 |
| My Learning + Manager Team Dashboard | | 5 |
| Certification expiry tracking + reminders | | 3 |
| **Epic total** | | **28** |

## Epic 25: Employee Engagement (Module 11)

| Story | Description | Points |
|---|---|---|
| Prisma schema: announcements, surveys, survey_responses (anonymous-safe design), recognitions | **Get the anonymous-response schema reviewed before building on it** | 5 |
| Announcements (targeted, with acknowledgement option) | | 5 |
| Survey creation + response (anonymity enforced server-side) | | 8 |
| Results view with minimum-respondent suppression | Enforced in the query, not just the UI | 5 |
| Recognition give/receive + feed | | 5 |
| **Epic total** | | **28** |

## Epic 26: Benefits Administration (Module 27)

| Story | Description | Points |
|---|---|---|
| Prisma schema: benefits_plans, benefits_elections (linking to existing Dependant records) | | 5 |
| Plan setup + eligibility rules (reuse Module 20's targeting logic) | | 5 |
| Open Enrollment flow (employee) | | 8 |
| Enrollment Admin Dashboard | | 3 |
| Payroll-deduction handoff to Module 6 | | 5 |
| Life-event off-cycle change request | | 5 |
| **Epic total** | | **31** |

---

## Phase total

**~182 story points.** No hard external gates in this phase (unlike Payroll) — normal engineering + QA cadence applies. Epic 25's anonymity design is the one story worth a dedicated review pass before merge, same spirit as (though lower stakes than) Module 26's POSH access control.
