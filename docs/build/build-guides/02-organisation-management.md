# Build Guide — Module 2: Organisation Management

**Full spec:** [modules/02-organisation-management.md](../../hrms-prd/modules/02-organisation-management.md)
**Sprint:** Foundation, Sprint 3. **Needs Module 1 done first** (employees have to exist to assign to org units).

---

## What this module is, in one paragraph

The screens where HR builds out the company's actual structure: legal entities, departments, teams, office locations, cost centres, and job grades/designations. Module 1 is about *people*; this module is about the *boxes those people sit in*. One important design idea: **a department, a location, and a cost centre are three separate things**, not one nested tree — a department can span two office locations, and Finance's cost-centre structure often doesn't match HR's department structure. Don't force them into one hierarchy.

## Data model, simply

`legal_entities` → `departments` (can nest into `sub_departments`) → `teams`. Separately: `locations` (offices) and `cost_centres` — both are just *tagged onto* an employee's Employment Assignment (Module 1), not nested inside the department tree. `grades`, `bands`, `designations` are their own small reference tables.

## Screens to build

1. **Organisation Setup (wizard)** — shown once, at tenant creation. Keep it minimal: one legal entity, one default location, done. Don't force a new customer to configure business units and cost centres before they can use the product — that's an "add complexity later" thing, not a launch blocker.
2. **Departments list + detail** — CRUD. Detail page shows: sub-departments, assigned employees (a filtered link into Module 1's directory, don't rebuild that table here), a "head of department" field.
3. **Locations list + detail** — CRUD, with a state/city field (matters later for Payroll's Professional Tax calculation).
4. **Grades/Bands/Designations** — a simple reference-data management screen, usually a settings-style table.
5. **Org Chart** — richer version than Module 1's basic tree: togglable between "reporting line" view (default) and a "dotted line" overlay for matrix org structures. Don't show both by default — that gets cluttered fast.
6. **Reorg tool** — pick a batch of employees, assign them all to a new department/manager at once, with a preview before committing (show a summary: "40 employees will move from Dept A to Dept B, effective [date]"), and the whole batch either fully applies or fully doesn't (no partial reorgs).

## Key user flow: bulk reorg

1. HR admin selects "Reorganisation," picks the affected employees (multi-select from a filtered list, or "everyone currently in Department X").
2. Sets the new department/manager for the batch, an effective date, and a reason.
3. Preview screen: shows exactly what will change for each employee, and flags anyone who'd end up with no valid manager or department (block until resolved).
4. Confirm → backend creates a new Employment Assignment row (Module 1) for every affected employee, all tagged with the same `reorg_event_id` so they're traceable as one event later, not 40 disconnected-looking changes.

## API endpoints

```
GET/POST/PATCH   /api/v1/legal-entities
GET/POST/PATCH   /api/v1/departments
GET/POST/PATCH   /api/v1/locations
GET/POST/PATCH   /api/v1/cost-centres
GET/POST/PATCH   /api/v1/grades, /bands, /designations
GET              /api/v1/org-chart              — full tree, current state
POST             /api/v1/reorg-events           — the batch-reassignment action
```

## Components

Mostly `@atlaskit/dynamic-table` + `@atlaskit/form` for the CRUD screens, `@atlaskit/modal-dialog` for create/edit dialogs. The org chart needs a custom component (no direct Atlaskit equivalent) — check the team hasn't already built something similar for Module 1's basic version before building a second one.

## What "done" looks like

- A new tenant can complete setup with just one legal entity and one location, no forced complexity.
- Deactivating a department with employees still assigned to it is blocked, with a prompt to reassign them first.
- A bulk reorg either fully commits or fully rolls back — no state where some employees moved and others didn't.

## Enterprise-phase addendum: Position Management

Later, add a `positions` table — a role can exist and be tracked as **vacant** independent of who fills it, enabling headcount planning and time-to-fill reporting. This is a genuine extension, not a rename of Designation — a Position is "Senior Engineer, Platform Team, budgeted, currently open," which an employee later fills (or doesn't). Build the requisition flow in Module 8 to reference a Position once this exists, rather than the lighter-weight "just approve a headcount request" version used until then.
