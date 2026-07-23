# Build Guide — Module 4: Attendance and Time Management

**Full spec:** [modules/04-attendance-time-management.md](../../hrms-prd/modules/04-attendance-time-management.md)
**Phase:** HR Operations. **This is one of the two highest-traffic modules in the whole product** (every employee, every day) — build with performance in mind from the start, not as an afterthought.

---

## What this module is, in one paragraph

Recording when people work — check-in/out from web, mobile, or a biometric device — and cleanly handling the messy reality of missed punches, late arrivals, and legitimate exceptions (working from home, field visits), so that by the time payroll needs the data, there's zero ambiguity left for any employee on any day.

## The core idea: flag, don't block

A missed punch or a late arrival gets automatically *flagged*, not rejected. The employee (or their manager) resolves it through "regularisation" — a request to correct the record, with a reason. Don't build this as a punitive block-and-appeal system; build it as "here's what we noticed, here's how to fix it if it's wrong."

## Screens to build

1. **Check-in/out widget** — a big, obvious button, on both web (a home-page widget, not buried in a menu) and mobile (this is the single most-used screen in the mobile app). Shows current status ("Checked in at 9:14 AM") and today's elapsed time.
2. **My Attendance** (employee view) — a calendar, one cell per day, colour-coded (present/absent/leave/holiday/flagged). Click a day to see the raw punch detail and, if flagged, a "Regularise" action.
3. **Regularisation Request form** — pick the date, enter the correct time(s), a reason. Submits into Module 17's workflow engine for manager approval.
4. **Team Attendance Calendar** (manager view) — the whole team, one row per person, so a manager can see coverage at a glance and jump straight into approving a pending regularisation from the same screen (don't make them navigate away to approve).
5. **Shift & Policy configuration** (HR admin) — define shift patterns (fixed/flexible/rotational), grace periods, holiday calendars.
6. **Monthly Attendance Lock** (HR/Payroll admin) — a screen showing every unresolved exception for the period, a countdown to the lock date, and the actual "lock this period" action.

## Key user flow: a missed punch getting fixed

1. Employee forgets to check out. Next day, their attendance calendar shows that day flagged.
2. They click the day, hit "Regularise," enter what time they actually left, with a reason ("forgot to punch out").
3. Request goes to their manager via Module 17 (reuse the engine — don't build a second approval system here).
4. Manager sees it on their Team Attendance Calendar, approves inline.
5. The record updates — but importantly, **we don't overwrite the original punch data, we layer the regularised value on top and keep both** (same "never erase, always supersede" pattern as Module 1's Employment Assignments — you'll see this pattern repeat across the whole product).

## Key user flow: monthly lock

1. As the configured cutoff date approaches, HR/Payroll admin opens the lock screen — sees a list of every employee with an unresolved exception.
2. Chases the remaining ones (or applies whatever the tenant's default policy is for unresolved items — e.g., treat as unpaid leave — this is a per-tenant setting, don't hard-code one answer).
3. Hits "Lock." From this second forward, attendance data for that period is read-only through the normal UI — any further correction has to go through a special "post-lock correction" path (build this later, alongside Module 6/Payroll — for now, just make locking irreversible through the normal screens).
4. Locked data becomes what Module 6 (built later) will read as payroll input.

## Data model, simply

`attendance_records` — one row per employee per day, computed status, raw punch times. `attendance_punches` — the actual raw check-in/check-out events (method, timestamp, location) — **never edited, only added to**; the "official" record for the day is derived from these plus any regularisation, but the raw punches stay as the permanent evidence trail. `regularisation_requests` — the correction workflow. Index `attendance_records` on `(employee_id, date)` — this table will be huge (employees × 365 days × years), and nearly every screen in this module queries by that pair.

## States

**Attendance record (per day):** `Unmarked` → `Present`/`Absent`/`On-Duty`/`WFH`/`Holiday`/`Weekly-Off` → (if exception) `Flagged` → `Regularisation-Pending` → `Regularised`/`Unresolved` → `Locked`.

## API endpoints

```
POST   /api/v1/attendance/check-in
POST   /api/v1/attendance/check-out
GET    /api/v1/attendance/me?from=&to=          — own calendar data
GET    /api/v1/attendance/team?from=&to=        — manager's team view
POST   /api/v1/attendance/regularisation        — submit a correction request (fires a Module 17 workflow event)
GET/POST/PATCH  /api/v1/shifts, /attendance-policies, /holiday-calendars
POST   /api/v1/attendance/lock                  — the monthly lock action
```

## Components

Calendar views: no direct Atlaskit calendar-grid component for this use case — build a custom one (check `@atlaskit/calendar` first, it may cover the base grid, but the colour-coding/click-to-regularise interaction is custom). Check-in widget: simple custom component using `Button` + `Lozenge` for status. Team view: `@atlaskit/dynamic-table`.

## What "done" looks like

- Check in from mobile with location capture, confirm it shows correctly on the web calendar within seconds.
- A missed punch auto-flags without blocking anything else the employee does.
- A regularisation request routes to the correct current manager (via Module 17 — confirm this integration actually works, don't assume).
- Locking a period makes the data genuinely read-only through the normal screens — try to edit a locked day and confirm it's blocked.
- Load-test the team calendar and directory-style attendance queries with a few thousand employees × a year of daily records before calling this "done" — this is the module most likely to have a real performance problem if the indexing isn't right.
