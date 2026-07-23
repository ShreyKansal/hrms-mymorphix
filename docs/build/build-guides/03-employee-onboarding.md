# Build Guide — Module 3: Employee Onboarding

**Full spec:** [modules/03-employee-onboarding.md](../../hrms-prd/modules/03-employee-onboarding.md)
**Phase:** HR Operations, first module to build in this phase.
**Needs:** Module 1 (Employee), Module 21 (Permissions), Module 17 (Workflow Engine), Module 18 (Notifications) — all from Foundation.

---

## What this module is, in one paragraph

Everything between "offer accepted" and "fully working, checked-off new hire." A new employee gets a portal to upload documents and fill forms before day one; HR, IT, Finance, and the manager each get their own short checklist of things to do; the system tracks all of it in one place instead of everyone chasing each other over email.

## The core idea: one Employee record, "Draft" until ready

When someone's hired, we don't wait until day one to create their Employee record (Module 1) — we create it immediately in `Draft` status, pre-filled with whatever we already know, and the onboarding checklist runs against that Draft record. Only once enough of the checklist is done does the record flip to `Active`. This means there's never a "the person exists in one system but not another" gap.

## Screens to build

1. **Preboarding Portal** (what the new hire sees, before they're a full system user — a limited-access mode, not the full Employee Self-Service they'll get once Active) — a simple checklist: upload ID/address proof, fill personal/bank/tax details, e-sign the offer/policy documents. Build this mobile-friendly from day one — a lot of new hires will do this from a phone.
2. **Onboarding Dashboard** (for HR) — every active new hire, with an overall progress bar and a flag for anyone at risk of missing their start date incomplete. This is the "don't make me check five people individually" screen — sort/filter by risk status first.
3. **New Hire Checklist Detail** — one page per new hire, sectioned by owner: HR tasks, IT tasks, Finance tasks, Manager tasks, Employee tasks. Each person only sees *their own* section as actionable; everyone can see the others read-only, so nobody's guessing what's blocking day one.
4. **Checklist Template Editor** (admin) — HR configures what tasks exist for a given role/department/location, so onboarding doesn't require an engineer every time the checklist needs a new step.
5. **Manager view: Buddy & Induction setup** — a simple form on the checklist for the manager's section: assign a buddy, schedule induction.

## Key user flow: offer accepted → day one

1. Recruitment (later module) or a manual "convert candidate" action creates a Draft Employee record, pre-filled from whatever's known.
2. System looks up the right checklist template (by role/department/location) and creates the actual checklist tasks for this specific new hire, with due dates relative to the joining date.
3. New hire gets a portal invite, uploads documents, fills forms.
4. HR verifies each document (approve / reject-with-reason — never a silent rejection).
5. As tasks complete across HR/IT/Finance/Manager, the dashboard's progress bar fills in.
6. Once the minimum required tasks are done, the Employee record flips from `Draft` to `Active` (this threshold is configurable per template — don't hard-code "100% of everything").
7. If the joining date changes, all the task due dates shift automatically — don't make someone manually re-date 15 tasks.

## States

**Onboarding record:** `Invited` → `In Progress` → `Ready for Activation` → (Employee record goes `Active`). Side paths: `Deferred` (date pushed back, tasks re-dated) and `No-Show` (grace period passed, archive the Draft record but keep it linked to the original candidate record in case they reapply later).

## API endpoints

```
POST   /api/v1/onboarding                    — kicks off onboarding for a Draft employee (creates checklist from template)
GET    /api/v1/onboarding/:id                 — the full checklist for one new hire
PATCH  /api/v1/onboarding/:id/tasks/:taskId   — mark a task complete
POST   /api/v1/onboarding/:id/documents       — document upload (pre-signed S3 URL, per architecture doc)
PATCH  /api/v1/onboarding/:id/documents/:docId/verify — HR approve/reject
POST   /api/v1/onboarding/:id/defer           — joining-date change, re-dates all tasks
POST   /api/v1/onboarding/:id/no-show         — archive path
GET/POST/PATCH /api/v1/onboarding-templates
```

## Components

Checklist UI: no direct Atlaskit component — build a shared `ChecklistSection` component (reusable later for Module 15's exit checklist, which has the identical shape). Document upload: `@atlaskit/form` + a custom file-drop component. Progress bar: `@atlaskit/progress-bar`. Dashboard: `@atlaskit/dynamic-table` with a custom "risk" indicator column.

## What "done" looks like

- Offer-accepted creates a Draft employee with zero manual re-typing of anything already known.
- A joining-date change automatically shifts every task's due date.
- A new hire with all mandatory tasks complete flips to `Active` without a manual HR step to "finish" it.
- A rejected document shows the new hire a specific reason and lets them re-upload — never a dead end.
