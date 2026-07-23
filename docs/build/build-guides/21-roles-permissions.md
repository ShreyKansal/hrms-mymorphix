# Build Guide — Module 21: Roles and Permissions

**Full spec:** [modules/21-roles-permissions.md](../../hrms-prd/modules/21-roles-permissions.md)
**Sprint:** Foundation, Sprints 1–2 (built together with Module 1 — see that build guide for why).
**This is the most important module in the whole product to get right.** A bug here doesn't break one feature, it potentially exposes data across every module. Read this guide twice.

---

## What this module is, in one paragraph

Every single API call in the entire product has to pass through this module's permission check before it does anything. Not most calls — all of them. The rule, stated plainly: **the frontend hiding a button is just being polite; the backend is what actually stops someone.** If you ever write a backend endpoint that trusts the frontend already checked permissions, that's a bug, full stop.

## The model, explained simply

Three things combine to decide "can this user do this action, on this data":

1. **Role** — what capabilities does this user have? (e.g., "can edit employee records," "can approve leave")
2. **Scope** — *which* records can they do it to? Not "can edit employee records" in the abstract, but "can edit employee records in the Bangalore office" or "can edit their own direct reports." Scope types: self / team (direct reports) / department / location / legal entity / a custom hand-picked list of people / everyone.
3. **Time** — is this permanent, or does it expire on a specific date? (Needed for things like a contract recruiter who should lose access automatically when their contract ends, not whenever someone remembers to revoke it.)

A user can hold **multiple roles at once** — a 50-person company's one HR person might have HR-Executive capabilities *and* Payroll-Executive capabilities *and* Recruiter capabilities, all at the same time. Don't build a "pick one role" dropdown — build "assign one or more role+scope combinations."

## One deliberate, important restriction: segregation of duties

Some role combinations are dangerous if given to one person — e.g., someone who can *both* prepare a payroll run *and* approve/lock it defeats the whole point of having a two-person check. When an admin tries to assign a combination like this, **block it by default** and require an explicit, logged override with a written reason. Don't build this as an afterthought — it's a specific, named requirement.

## Screens to build

1. **Roles list** — table of system roles (pre-built, like "HR Administrator") and custom roles (tenant-defined). Click into one to see/edit its capabilities.
2. **Role Detail / Editor** — a matrix: modules down one side, actions across the top (View, Create, Edit, Delete, Approve, Export, etc.), checkboxes at the intersections. For field-level permissions (like "can see compensation data"), a separate, more focused section — don't try to cram field-level detail into the same big matrix, it gets unreadable.
3. **User → Role Assignment** — pick a user, assign one or more roles, and for each role, pick the scope (self/team/department/location/entity/custom list) and, if temporary, an end date.
4. **My Effective Permissions** (a diagnostic/debug screen, genuinely useful for support) — pick any user, see the *combined* result of everything they've been granted. This answers "why can't this person see X" fast instead of everyone guessing.
5. **Access Review** — a periodic report: every active grant, flagging ones that are about to expire, ones that have been extended a suspicious number of times, and any active segregation-of-duties override.

## Key user flow: assigning a role with a scope

1. Admin opens a user's permissions page, clicks "Add Role."
2. Picks a role from the list (e.g., "People Manager").
3. Picks a scope type (e.g., "Team" — this automatically means "their direct reports, derived live from the org chart, not a fixed list").
4. Optionally sets an expiry date (for temporary access — e.g., an external consultant).
5. Backend checks: does this new grant, combined with the user's existing grants, create a segregation-of-duties conflict? If yes, block and show why, with an "override with justification" path for genuine exceptions.
6. Saved. From this point on, **every** API call this user makes gets checked against this.

## How the backend check actually works (for the engineers building this)

Build this as a NestJS Guard that runs before every controller method — not something each controller author has to remember to call. The guard needs to answer, for a given user + action + record:

1. Does the user hold any role granting this action on this module? (If no → 403, stop here.)
2. What's the scope of that grant? (self/team/department/etc.)
3. Does the specific record being accessed fall inside that scope? (e.g., is this employee actually one of the user's direct reports, checked live against the current org chart via Module 1/2's data — never a cached/stale scope list.)
4. Is there a field-level restriction that applies? (e.g., action is allowed, but the compensation field specifically should come back masked/removed from the response.)

This is why Module 1 and Module 21 are built together — you can't finish Module 1's endpoints without this guard existing, and you can't test this guard meaningfully without real Employee data to check scope against.

## API endpoints to build

```
GET    /api/v1/roles                        — list system + custom roles
GET    /api/v1/roles/:id                    — detail (capability matrix)
POST   /api/v1/roles                        — create custom role
PATCH  /api/v1/roles/:id                    — edit
GET    /api/v1/users/:id/roles              — a user's current role/scope assignments
POST   /api/v1/users/:id/roles              — assign a role+scope (+ optional expiry)
DELETE /api/v1/users/:id/roles/:assignmentId — revoke
GET    /api/v1/users/:id/effective-permissions — the diagnostic view
GET    /api/v1/access-review                — the periodic review report
```

## What "done" looks like

- Change a user's role to remove a capability → they're blocked immediately, tested by hitting the API directly (not just checking the UI hides a button).
- Grant a temporary access with an end date → on that date, access is automatically gone, and this is logged, with no manual step required.
- Try to assign someone both Payroll-prepare and Payroll-approve capabilities → blocked by default, with a clear message and an override path that requires a written reason.
- A People Manager with "Team" scope → genuinely only sees their own direct reports' data, and this stays correct automatically when the org chart changes (because scope is checked live, not cached).
