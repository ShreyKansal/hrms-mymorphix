# Build Guide — Module 15: Employee Separation and Offboarding

**Full spec:** [modules/15-employee-separation-offboarding.md](../../hrms-prd/modules/15-employee-separation-offboarding.md)
**Phase:** HR Operations. Needs Module 14 (Assets) for full checklist coverage, but can build with a stubbed asset-check for now if Module 14 isn't done yet.

---

## What this module is, in one paragraph

The mirror image of Onboarding (Module 3) — resignation or termination through last working day, an exit checklist spanning IT/Finance/Manager/Assets, and, critically, **making sure system access gets cut off at exactly the right moment, not too early (while they're still working their notice) and not too late (a security gap).**

## The one thing to get very right: access-revocation timing

This is the highest-stakes piece of this module from a security standpoint. Build it as an actual scheduled event tied to the confirmed last working day — not a manual reminder to IT that depends on someone remembering. For an immediate termination, it should fire right away, not wait for an end-of-day batch job.

## Screens to build

1. **Initiate Resignation** (employee) — proposed last working day, optional reason.
2. **Initiate Separation** (manager/HR, for termination/other cases) — requires HR admin involvement from the start (this is not a self-service manager action the way resignation is employee-initiated).
3. **Notice Period Reconciliation** (HR admin) — system calculates the policy-compliant last working day; HR reconciles it against what the employee proposed, with an explicit waive/recover decision if there's a gap.
4. **Exit Checklist** — the same shared `ChecklistSection` component built for Module 3's onboarding checklist, sectioned by owner (IT, Finance, Manager, Assets). This is a genuinely reusable UI pattern, don't rebuild it from scratch.
5. **Separations Dashboard** (HR) — every in-progress separation, checklist completion status.

## Key user flow: resignation to last day

1. Employee submits resignation with a proposed date.
2. HR reconciles against notice-period policy, confirms the actual last working day (with waive/recover decision if needed).
3. Exit checklist auto-generates — including an asset-recovery item pulling directly from Module 14's "what's currently assigned to this person" data.
4. On the last working day, the access-revocation event fires automatically (this is the critical piece — build it as a scheduled job keyed to that exact date/time, tested explicitly, not assumed to work).
5. Once the checklist's mandatory items are done, the employee's Module 1 record moves to `Separated` (terminal status).

## Data model

`separations` (type: resignation/termination/retirement/etc., last working day, notice-period decision), reuses the same checklist-item pattern as Module 3. `access_revocation_events` — log both "we fired the revocation" and "we confirmed it actually completed" as two separate things — a fired event isn't proof the downstream IT system actually acted on it.

## States

`Initiated` → `Notice-Period-In-Progress` → `Exit-Checklist-In-Progress` → `Settlement-Pending` → `Separated` (terminal).

## API endpoints

```
POST   /api/v1/separations                       — resignation or HR-initiated
PATCH  /api/v1/separations/:id/last-working-day   — reconciliation
GET    /api/v1/separations/:id/checklist
PATCH  /api/v1/separations/:id/checklist/:itemId
POST   /api/v1/separations/:id/trigger-access-revocation   — the scheduled job calls this
POST   /api/v1/separations/:id/confirm-access-revocation   — IT confirms completion
```

## Components

Same `ChecklistSection` shared component from Module 3. `@atlaskit/dynamic-table` for the dashboard.

## What "done" looks like

- Set a last working day, confirm the access-revocation job fires at exactly that date/time — test with both a future date and an "immediate" termination.
- The exit checklist correctly pulls in every asset currently assigned to the employee from Module 14 — no manual step to look that up separately.
- A resignation withdrawn before the last working day cleanly reverts the employee back to `Active` and cancels the in-flight checklist, rather than leaving orphaned tasks.
