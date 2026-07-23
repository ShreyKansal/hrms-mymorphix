# Build Guide — Module 8: Recruitment and Applicant Tracking

**Full spec:** [modules/08-recruitment-applicant-tracking.md](../../hrms-prd/modules/08-recruitment-applicant-tracking.md)
**Phase:** Talent. Needs Module 2 (Org — for requisitions), Module 1 (for the hire-conversion handoff), Module 17 (approvals), Module 13 (offer letters).

---

## What this module is, in one paragraph

Job opening → candidates apply → interviews happen → someone gets an offer → they accept → they become a real employee record, automatically. The single most important thing to get right: that last step. When an offer is accepted, nobody should ever have to retype a candidate's details into the Employee system — it should just become one.

## Screens to build

1. **Requisition** — raise a job opening (role, grade, headcount, budget justification), route for approval.
2. **Job Posting** — publish (career site + configured job boards, later via Module 23).
3. **Candidate Pipeline** (Kanban-style board is the natural UI here — columns = stages: Applied → Screening → Interview → Offer → Hired/Rejected). Configurable stages per role.
4. **Candidate Profile** — parsed resume data, application source, full interview/scorecard history in one place.
5. **Interview Scheduling** — panel assignment; if you have time, candidate self-scheduling against panel availability is a real efficiency win, but it's fine as a later-phase add if the calendar-integration work is bigger than expected.
6. **Scorecard** — a short, structured form each interviewer fills in — not a blank text box. Structure beats free text for comparing candidates fairly.
7. **Offer** — generate from a template (reuses Module 13), with compensation validated against the role's approved Grade/Band (Module 1/2) — an offer outside the approved band should hard-stop and require an explicit override approval, not just a warning.

## Key user flow: offer accepted → employee exists

1. Recruiter marks the offer "Accepted."
2. System creates a Draft Employee record (Module 1) pre-filled from everything already captured about this candidate — name, contact info, offered compensation, designation, start date.
3. Module 3's onboarding checklist kicks off automatically against that Draft record.
4. The new Employee record stays linked back to the original candidate/application record (for funnel reporting later — "how long from application to hire" needs this link to survive the conversion).

## Data model

`job_requisitions`, `candidates`, `applications` (the join between candidate and requisition, carrying pipeline stage), `interviews` + `scorecards`, `offers`. On hire: `applications.converted_employee_id` links forward to Module 1's employee table.

## API endpoints

```
POST/PATCH  /api/v1/requisitions
GET/POST    /api/v1/candidates
POST        /api/v1/applications                    — apply to a requisition
PATCH       /api/v1/applications/:id/stage           — move through pipeline
POST        /api/v1/interviews + /api/v1/interviews/:id/scorecard
POST        /api/v1/offers                            — validates against Grade/Band
PATCH       /api/v1/offers/:id/accept                — triggers the employee-conversion flow
```

## What "done" looks like

- Accept an offer, confirm a Draft Employee record appears with zero manually retyped fields, and Module 3's checklist auto-starts.
- Try to send an offer above the approved band for that grade — confirm it's blocked pending override approval, not silently sent.
- Duplicate-candidate detection: apply with the same email twice, confirm the system flags it rather than creating two disconnected profiles.
