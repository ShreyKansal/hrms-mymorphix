# Build Guide — Module 11: Employee Engagement

**Full spec:** [modules/11-employee-engagement.md](../../hrms-prd/modules/11-employee-engagement.md)
**Phase:** Talent.

---

## What this module is, in one paragraph

Announcements, pulse surveys, and quick peer recognition. Lower-risk than most of this product, with one real exception worth taking seriously: **if a survey promises anonymity, it has to actually be anonymous — structurally, not just by policy.**

## The one hard rule: anonymity has to be real

If a survey is marked anonymous, there must be **no path, for any role, including HR Administrator, to trace a response back to who submitted it.** Practically: don't store a direct foreign key from `survey_response` to `employee_id` for anonymous surveys — if you need to prevent double-submission, use a one-way hash or a separate "has this person responded" flag that doesn't link to the response content itself. Also: **suppress results for any group small enough that the answer is obviously one specific person** — e.g., don't show a team-level breakdown for a team of 3. Set a minimum-respondent-count threshold (5 is a reasonable default) below which results roll up to a larger group instead of displaying.

## Screens to build

1. **Announcements** — post, target by department/location, optional acknowledgement tracking.
2. **Surveys** (admin: create/launch; employee: respond) — configurable anonymity, minimum-respondent suppression baked into the results view, not bolted on later.
3. **Survey Results** (admin) — aggregate view, respecting the suppression rule above, with trend-over-time for recurring pulse surveys.
4. **Recognition** — a lightweight "give kudos" action (pick a colleague, pick a value/reason, optional note) — keep this to 2-3 taps, this is meant to be quick and frequent.
5. **Recognition Feed** — a simple chronological view, filterable by team.

## Key user flow: an anonymous pulse survey

1. Admin creates a survey, marks it anonymous, sets the target population.
2. Employees respond — the response is stored without a link back to who submitted it (see the hard rule above).
3. Results page: if a filtered slice (e.g., "Engineering, Bangalore") has fewer than the configured minimum respondents, that slice is hidden or rolled up — this should be enforced in the query itself, not just hidden in the UI (someone hitting the API directly shouldn't get the raw small-group number either).

## Data model

`announcements`, `surveys`, `survey_responses` (anonymous ones deliberately un-linked to employee), `recognitions`.

## API endpoints

```
POST/GET  /api/v1/announcements
POST      /api/v1/surveys
POST      /api/v1/surveys/:id/responses          — no employee_id stored if anonymous
GET       /api/v1/surveys/:id/results             — enforces minimum-respondent suppression server-side
POST      /api/v1/recognitions
GET       /api/v1/recognitions/feed
```

## What "done" looks like

- Submit an anonymous survey response, then, as a System Administrator with full database access, confirm there's genuinely no way to trace it back to the submitter — check the actual schema, not just the UI.
- Request results for a group below the minimum-respondent threshold via the API directly (not the UI) — confirm it's still suppressed, not just hidden client-side.
- Give recognition to a colleague in 2-3 taps, start to finish.
