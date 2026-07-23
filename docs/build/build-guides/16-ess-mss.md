# Build Guide — Module 16: Employee and Manager Self-Service

**Full spec:** [modules/16-ess-mss.md](../../hrms-prd/modules/16-ess-mss.md)
**Phase:** HR Operations, build once Modules 3/4/5 exist (this module has almost nothing of its own — it's the front door to everything else).

---

## What this module is, in one paragraph

The homepage. Two of them, really: an Employee Home and a Manager Home. **This module owns zero data of its own** — it's a curated view that pulls live from Modules 1, 4, 5, 12, 13, etc. Don't build a cache or a copy of anything here; always call through to the real module's API. The moment this screen shows stale data because of some local cache, we've broken the entire "one source of truth" promise the whole product is built on.

## Screens to build

1. **Employee Home** — a dashboard of "what needs my attention" (pending policy acknowledgement, an upcoming approved leave, a document to sign) plus quick links: attendance, leave, payslips (once Module 6 exists), documents, helpdesk, directory, resignation. Think "what would I want to see the moment I log in," not "a link to every module."
2. **Manager Home**, centred on:
3. **Unified Approval Inbox** — this is the important one. Every approval from every module (leave, attendance regularisation, reimbursement once Module 7 exists, onboarding sign-offs) shows up in *one list*, not four separate places the manager has to remember to check. Group by type, sort by urgency/due date. For simple decisions, let the manager approve/reject right from this list; for anything needing real context (like a compensation change), deep-link into the owning module's full record instead of cramming everything into a list row.
4. **Team Overview** (part of Manager Home) — a quick team roster/attendance/leave snapshot.

## Key user flow: the unified inbox

1. Module 5 (Leave) creates an approval task via Module 17 (Workflow Engine), routed to a manager.
2. Module 17 exposes a generic "pending approvals for this user" endpoint — that's what this screen calls, not five separate calls to five separate modules.
3. Manager sees it in the inbox, alongside anything else pending from other modules, approves inline.
4. The action is written back to the owning module (Module 5) — this screen never directly changes leave data, it just calls the approve/reject action, which Module 17/Module 5 handle.

## Data model

None of its own. If you find yourself wanting to add a table here, stop — it almost certainly belongs to whichever module actually owns that data.

## API endpoints

```
GET   /api/v1/home/employee     — aggregated payload for the Employee Home dashboard
GET   /api/v1/home/manager      — aggregated payload for Manager Home
GET   /api/v1/approvals/pending — the unified inbox (built in Module 17, called from here)
```

These aggregation endpoints can live in a thin NestJS module that just calls the other modules' services directly (not over HTTP internally — same process, same database transaction where relevant) and combines the results.

## Components

`@atlaskit/page-layout` for the dashboard grid, `@atlaskit/dynamic-table` or a custom list for the approval inbox (with grouping — check if `dynamic-table` supports grouped rows cleanly, or build a simple sectioned list instead).

## What "done" looks like

- Approve a leave request from the unified inbox, then check Module 5's own leave-request screen directly — it shows the exact same approved state, no lag, no inconsistency.
- Log in as an employee who is *also* a manager (reports to someone, but has their own reports too) — confirm there's an easy, obvious way to switch between "my stuff" and "my team's stuff" without it feeling like two different apps.
- Kill one underlying module's API temporarily (e.g., stop the Helpdesk service) and confirm the dashboard degrades gracefully — shows what it can, doesn't crash the whole homepage over one module being down.
