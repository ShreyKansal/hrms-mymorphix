# Build Guide — Module 10: Learning and Development

**Full spec:** [modules/10-learning-development.md](../../hrms-prd/modules/10-learning-development.md)
**Phase:** Talent.

---

## What this module is, in one paragraph

A course catalogue plus, more importantly, **automatic enrollment in mandatory/compliance training** based on rules (role, location, grade) — so a new hire or a location-change automatically gets enrolled in whatever's legally/company-required, without HR remembering to do it manually. Don't try to build a full content-authoring/video-hosting platform here — that's a different, deeper product category; integrate with external LMS tools for content depth instead.

## Screens to build

1. **Course Catalogue** — browse, self-enroll where allowed.
2. **My Learning** — assigned (mandatory + elective) courses, status, deadlines, certificates.
3. **Mandatory Training Rules** (HR admin) — "everyone in Karnataka completes X annually," "every new hire completes Y within 30 days" — configuration, not code.
4. **Manager's Team Training Dashboard** — completion status across the team, overdue items visually prioritized.
5. **Certification tracking** — expiry dates, renewal reminders.

## Key user flow: automatic mandatory enrollment

1. A trigger fires — a new hire completes onboarding (Module 3), or an employee's location changes (Module 1) into a new applicability zone.
2. System checks the mandatory-training rules, finds a match, auto-creates an enrollment for that employee — no manual admin step.
3. Employee sees it on their My Learning list with a due date; escalating reminders as the deadline nears.
4. Completion (internal or logged from an external LMS) is recorded with a retained certificate/evidence artifact — this matters for compliance audits later, don't skip storing proof.

## Data model

`courses`, `mandatory_training_rules` (the applicability config, reuse the same targeting pattern as Module 20's policy applicability), `enrollments` (status, due date, completion evidence), `certifications` (expiry tracking).

## API endpoints

```
GET/POST  /api/v1/courses
GET/POST/PATCH  /api/v1/mandatory-training-rules
GET       /api/v1/enrollments?employeeId=
POST      /api/v1/enrollments/auto-assign      — internal, called by Module 3/1's trigger events
PATCH     /api/v1/enrollments/:id/complete
GET       /api/v1/certifications?expiringBefore=
```

## What "done" looks like

- Add a new location to a mandatory-training rule's scope, confirm every employee at that location gets auto-enrolled without a manual bulk-assign action.
- A new hire completes onboarding, confirm their mandatory training assignments appear without anyone manually adding them.
- A certification approaching expiry sends a reminder before it lapses, not after.
