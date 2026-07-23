# Build Guide — Module 14: Asset Management

**Full spec:** [modules/14-asset-management.md](../../hrms-prd/modules/14-asset-management.md)
**Phase:** Enterprise (though its exit-checklist integration is needed by Module 15 — build a minimal version earlier if Separation needs it before this phase, per the note in that build guide).

---

## What this module is, in one paragraph

Track which laptop/phone/badge belongs to which employee, and make sure it comes back when they leave. Genuinely the lowest-risk, most straightforward module in the whole product — don't over-build it.

## Screens to build

1. **Asset Inventory** — list, filter by category/status/assigned-to.
2. **Asset Detail** — full history (every assignment, condition change, repair).
3. **Assign Asset** — pick an asset, pick an employee, record condition, employee acknowledges (e-signature via Module 13).
4. **Return/Recovery** — mark returned, record condition, flag damage/loss for potential cost recovery (feeds Module 6's full-and-final settlement if relevant).

## Key user flow: assignment through recovery

1. New hire's onboarding checklist (Module 3) includes an asset-assignment task — HR/IT picks a laptop, assigns it, employee acknowledges.
2. Shows up on the employee's Module 1 Assets tab automatically.
3. When the employee separates (Module 15), the exit checklist auto-generates a recovery item listing everything currently assigned to them — **pull this live from this module's data, don't make the separation flow maintain its own copy.**
4. IT confirms return; any damage/loss gets flagged with a cost that can feed into the final settlement calculation.

## Data model

`assets` (inventory, current status), `asset_assignments` (history, append-only — same pattern as everywhere else in this product).

## API endpoints

```
GET/POST/PATCH  /api/v1/assets
POST            /api/v1/assets/:id/assign
POST            /api/v1/assets/:id/return
GET             /api/v1/employees/:id/assets            — called by Module 1's Assets tab and Module 15's exit checklist
```

## What "done" looks like

- Assign an asset during onboarding, confirm it shows up on the Employee Detail page's Assets tab.
- Initiate a separation for that employee, confirm the exit checklist automatically lists the asset without anyone manually looking it up.
