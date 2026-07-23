# Build Guide — Module 18: Notifications and Communication

**Full spec:** [modules/18-notifications-communication.md](../../hrms-prd/modules/18-notifications-communication.md)
**Sprint:** Foundation, Sprint 5 (paired with Module 22).

---

## What this module is, in one paragraph

The one place every other module sends a "tell the user something happened" message through. Two failure modes to actively avoid: **too quiet** (someone misses an approval sitting in their inbox for a week) and **too loud** (so many notifications people start ignoring all of them, including the important ones). This module's whole job is giving users real control over that balance.

## The core idea: priority decides what can't be turned off

Every notification a module sends has a priority: **informational** (a colleague recognised you — nice to know, fully mutable by user preference), **important** (your leave was approved), or **critical** (a payroll run failed — Payroll Admin needs to see this no matter what). Users can dial down informational/important notifications to whatever channel they want (email only, nothing, etc.) — but critical notifications always get through, on every channel the user has a contact method for.

## Screens to build

1. **Notification Centre** (top-nav, always accessible) — a dropdown/panel list, read/unread state, click-through to the source record. Don't build a separate full-page version yet unless volume demands it.
2. **Preferences** — a matrix: notification categories down one side, channels (in-app / email / push) across the top, checkboxes. Show clearly which categories are marked "critical, can't be turned off" by the tenant.
3. **(Admin) Template management** — for HR Admins to see/edit the wording of system notifications. Foundation phase: hard-code a first pass of templates in code; build the admin editing UI later once there are enough real templates to justify it.

## Key user flow: a notification firing

1. Some module (e.g., Module 17, when an approval completes) calls this module's API with an event type, recipient, and the data needed to fill in the template.
2. This module looks up the recipient's channel preferences, filtered by the event's priority (critical overrides a narrowed preference; informational/important respect it).
3. Sends via each resolved channel (email through whatever provider is configured, push if the mobile app is installed, always in-app).
4. If delivery fails on every channel for a *critical* notification, that itself needs to alert an admin — a critical message that never arrived is a real operational problem, not just a minor bug.

## API endpoints

```
POST   /api/v1/notifications          — any module calls this to send one
GET    /api/v1/notifications          — the current user's notification list (for the Notification Centre)
PATCH  /api/v1/notifications/:id/read — mark read
GET    /api/v1/notification-preferences
PATCH  /api/v1/notification-preferences
```

## What "done" looks like

- Send a test "important" notification, confirm it respects a user's channel preference.
- Send a test "critical" notification to a user who's narrowed their preferences down to nothing, confirm it still reaches them on whatever channel they have a contact method for.
- Simulate every channel failing for a critical notification, confirm an admin gets alerted about the failure itself.
