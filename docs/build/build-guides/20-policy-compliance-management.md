# Build Guide — Module 20: Policy and Compliance Management

**Full spec:** [modules/20-policy-compliance-management.md](../../hrms-prd/modules/20-policy-compliance-management.md)
**Phase:** HR Operations.

---

## What this module is, in one paragraph

The company's policy documents (leave policy, code of conduct, etc.), with version control and proof that specific employees actually acknowledged the current version — plus a compliance calendar for recurring legal obligations (statutory filing deadlines, etc.). The one rule that matters most: **acknowledging version 1 of a policy does not count as acknowledging version 2.**

## Screens to build

1. **Policy Library** (employee view) — browse/read policies that apply to them, acknowledge (a simple "I have read and understood this" action, possibly gated behind actually scrolling through it).
2. **Policy Management** (HR admin) — create/edit policies, set which employees they apply to (reuse the same department/location/employment-type targeting logic from Module 2/Module 1 — don't invent a new targeting concept here), publish new versions.
3. **Acknowledgement Status** (HR admin) — for a given policy, see exactly who has and hasn't acknowledged the *current* version, with the ability to send a reminder to stragglers.
4. **Compliance Calendar** (HR admin) — a list of recurring compliance tasks (owner, due date, evidence required), with reminders as deadlines approach.

## Key user flow: publishing a policy update

1. HR admin edits an existing policy, creating a new version.
2. Sets applicability (who this applies to — same targeting dimensions used elsewhere in the product).
3. Publishes → the system finds every currently-in-scope employee and creates a fresh "needs to acknowledge version 2" record for each of them — **even for employees who already acknowledged version 1.**
4. Employees see it on their Employee Home (Module 16) as a pending action, acknowledge it.
5. A new employee who joins after publication, but who falls in scope, automatically gets enrolled for acknowledgement too — this shouldn't require a manual "add them" step.

## Data model

`policies`, `policy_versions` (old versions kept, never deleted), `policy_acknowledgements` (per employee, per *version* — the version-specificity is the whole point, model it explicitly, don't just have one "acknowledged: yes/no" flag per policy). `compliance_tasks` for the calendar piece.

## API endpoints

```
GET/POST/PATCH  /api/v1/policies
POST            /api/v1/policies/:id/versions          — new version, applicability rules
POST            /api/v1/policies/:id/publish
POST            /api/v1/policy-acknowledgements          — employee acknowledges
GET             /api/v1/policies/:id/acknowledgement-status  — who has/hasn't, for the current version
GET/POST/PATCH  /api/v1/compliance-tasks
```

## Components

Policy reading view: `@atlaskit/page-layout` with a simple rendered-content area. Acknowledgement status: `@atlaskit/dynamic-table`, filterable by department/status. Compliance calendar: reuse the same calendar-adjacent component built for Module 4/5 if it fits, or a simple list sorted by due date.

## What "done" looks like

- Publish a new policy version → every employee who acknowledged the old version shows as "outstanding" for the new one, without exception.
- A new employee joining after a policy is published, but within its applicability scope, automatically appears in the "needs to acknowledge" list — not missed because they weren't there at publish time.
- Applicability rules that resolve to zero employees are flagged as a likely misconfiguration at publish time, not silently accepted.
