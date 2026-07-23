# Build Guide — Module 24: Mobile Experience

**Full spec:** [modules/24-mobile-experience.md](../../hrms-prd/modules/24-mobile-experience.md)
**Phase:** HR Operations, once Modules 4/5/16 have working web versions to build the mobile equivalents against.
**Stack:** React Native, per [00-architecture-and-tech-stack.md](../00-architecture-and-tech-stack.md) §8. Same NestJS backend as web — no separate mobile API.

---

## What this module is, in one paragraph

Not "the web app on a smaller screen." A separate, deliberately smaller app covering only the handful of things people actually do on their phone constantly: check in/out, apply for and approve leave, view payslips, submit an expense with a photo, browse the directory, get notifications. Big, complex, occasional actions (running payroll, configuring permissions) are **not** in this app, on purpose.

## What to build, screen by screen

1. **Check-in/out** — the most important screen in the app. Big button, current status, works offline (see below).
2. **Leave** — apply, view balance/status; for managers, approve from a push-notification tap where possible.
3. **Approval Inbox** — same unified inbox as Module 16's web version, calling the same API.
4. **Payslip view** — read-only, view/download. No processing actions live here, ever (see Architecture doc's note on why high-risk actions stay desktop-only).
5. **Expense submission** — camera-based receipt capture is the whole point of this screen; make it as close to "one photo, done" as possible.
6. **Directory** — search colleagues.
7. **Notifications** — push notifications with deep links into the relevant screen.

## The one hard technical problem: offline check-in

Someone in an area with patchy mobile data checks in. We cannot lose that. Build it like this:

1. On check-in tap, immediately save the attempt to local device storage (timestamp, location, method) — this happens **before** trying to talk to the server.
2. Try to sync to the server. If it succeeds, mark it synced.
3. If it fails (no connectivity), leave it queued locally and retry when connectivity returns (a background sync, not something the user has to manually retry).
4. **The timestamp that matters is the original local capture time, not whenever the sync eventually succeeds.** Send both to the backend; the backend records the real event time as the local-capture one.
5. Show the user a clear "pending sync" state so they know it's captured but not yet confirmed — never silently pretend it's already fully recorded if it isn't.

This is genuinely the trickiest thing to build in this whole module — budget real time for it, and test it by actually turning off your phone's network mid-flow, not just reasoning about it.

## API endpoints

Reuses the same endpoints as the web app for everything (`/api/v1/attendance/check-in`, `/api/v1/leave/requests`, etc.) — the mobile app is a different client of the same API, not a different API. The one addition:

```
POST   /api/v1/attendance/check-in    — accepts an optional `capturedAt` field distinct from server-received time, for the offline-sync case
```

## What NOT to build here

Anything from Module 6 (Payroll processing), Module 21 (permission configuration), Module 2 (org structure editing), or any bulk-action screen. If a Module Build Guide for another module mentions "high-blast-radius action, desktop-only" — that's your signal it doesn't belong in this app.

## What "done" looks like

- Turn off wifi/data, check in, turn connectivity back on — confirm it syncs with the correct original timestamp, not the reconnection time.
- Tap a push notification for a pending leave approval — confirm it deep-links straight to that specific request, not just opens the app to its home screen.
- Submit an expense claim with a receipt photo in under 30 seconds, start to finish, on a real device — if it takes longer, that's a UX problem worth flagging before calling this done.
