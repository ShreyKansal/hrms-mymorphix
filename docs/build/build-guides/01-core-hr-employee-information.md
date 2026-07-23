# Build Guide — Module 1: Core HR and Employee Information

**Read the full product spec first if you want the "why":** [modules/01-core-hr-employee-information.md](../../hrms-prd/modules/01-core-hr-employee-information.md). This guide is the "what to actually build" translation — plain language, concrete screens, concrete data, concrete endpoints.
**Sprint:** Foundation, Sprints 1–2 (built together with Module 21).
**You'll also need:** [00-architecture-and-tech-stack.md](../00-architecture-and-tech-stack.md), [05-organisation-data-model.md](../../hrms-prd/05-organisation-data-model.md) (read §7 carefully — the "Employment Assignment" pattern below is the single most important idea in this whole module).

---

## What this module is, in one paragraph

Every employee in the system has one record here. Everything else in the product — attendance, leave, payroll, performance — points back to this employee record. The one tricky, important idea: when something about an employee changes (their department, their manager, their job title, their salary), **we don't overwrite the old value — we create a new dated record and keep the old one.** That's how the system can answer "who was Priya's manager last March" months or years later. Get this pattern right here, because every other module builds on it.

## Why it matters if we get it wrong

If we just store "current department" as a field we overwrite, we lose all history the moment someone gets transferred. Payroll won't be able to prove what someone's salary was on a specific date. HR won't be able to answer a legal/audit question about who approved what, when. Retrofitting this later means rebuilding the database — so this is worth getting right in Sprint 1, not "good enough for now."

## The core data model, explained simply

Two tables matter more than any others in this module:

**`employees`** — the boring, rarely-changing stuff: legal name, date of birth, gender, government IDs (PAN, Aadhaar), personal contact info, emergency contacts. This table has one row per person, ever.

**`employment_assignments`** — everything that changes over an employee's career: department, manager, location, job title, grade, employment type, payroll group. This table has **many rows per person** — every transfer, promotion, or manager change adds a new row instead of editing an old one. Each row has:
- `effective_from` (when this became true)
- `effective_to` (when it stopped being true — empty/null means "still current")
- `reason_code` (why: "Promotion", "Transfer", "Correction", etc. — never optional)
- `created_at` (when we entered this into the system — different from `effective_from`, because sometimes we backdate a correction)

To find "what was true on a given date," you query: `WHERE employee_id = X AND effective_from <= date AND (effective_to IS NULL OR effective_to > date)`. This single query pattern is used constantly — index `(employee_id, effective_from)` from day one.

**Compensation is its own separate table**, same effective-dated pattern, because salary changes independently of department/title changes (an annual raise with no title change; a lateral transfer with no pay change).

## Screens to build

1. **Employee Directory** (list page) — searchable table of all employees. Columns: photo, name, department, designation, manager, status. Search bar (typeahead by name/email/ID). Filters: department, location, employment type, status. Click a row → Employee Detail page. *Keep row actions minimal — one "View" action, nothing else cluttering the row (this is a product-wide rule, not just this screen).*

2. **Employee Detail** (the main screen of this module) — tabs:
   - **Profile** — personal info, contact info, emergency contacts, dependants, nominees, education, previous employment, skills, certifications.
   - **Employment** — shows the *current* Employment Assignment prominently, with a "history" section below showing every past assignment as a timeline (not a flat table — think "chronological cards," each showing what changed, when, and why).
   - **Compensation** — current and historical pay, visible only to users with the right permission (Payroll roles, HR Admin, the employee themselves). This tab should be *invisible*, not just disabled, to users without access.
   - **Documents** — links out to Module 13 (build later).
   - **Assets** — links out to Module 14 (build later).
   - **Timeline** — a single chronological feed of *every* change ever made to this employee's record, across every tab, with who made it and why. This is the audit view — build it as a first-class tab, not an afterthought.

3. **Create Employee** — a form (modal for a quick add, or a full page for onboarding-linked creation — for Foundation phase, build the simple modal version; the full onboarding-linked flow comes with Module 3). Fields: name, DOB, gender, at least one government ID, department, designation, grade, manager, employment type, joining date. Uses `@atlaskit/form`'s validation — required-field asterisks, inline error messages, never a disabled submit button (see architecture doc §2 on why we use Atlaskit Form's own validation, not a separate library).

4. **Transfer/Change Employee** — a focused form (Modal, per Atlaskit's own guidance that Modal is for one-task actions): pick what's changing (department, manager, designation, grade, location), enter effective date and a reason. This is what actually creates a new Employment Assignment row.

5. **Org Chart** (simple version for this module — richer version comes with Module 2) — a basic tree view showing manager → reports.

## Key user flow: transferring an employee

1. HR user opens an employee's detail page, clicks "Transfer" (a primary action in the page header, not buried in a menu).
2. Modal opens: new department, new manager (defaults to the new department's usual manager, but overridable), effective date, reason (required dropdown: Transfer / Promotion / Manager Change / Location Change / Correction).
3. On submit: backend creates a new `employment_assignments` row with the new values and the given `effective_from`; the previous row's `effective_to` gets set to that same date.
4. If the effective date is in the past *and* falls inside a payroll period that's already been locked (ask Module 6's team once that exists — for Foundation phase, just check a `payroll_locked_periods` flag), block the change and tell the user to use the (not-yet-built) correction flow instead.
5. Employee's detail page now shows the new assignment as current, and the old one appears in the Employment History timeline.

## States a record can be in

`Draft` (created but joining not confirmed) → `Active` → `On Leave` / `Suspended` → `Separation-Initiated` (handled by Module 15, later). Foundation phase only needs `Draft` and `Active` — the others become relevant once Modules 3/4/15 exist, but build the status field to support all of them now so it's not a migration later.

## API endpoints to build

```
GET    /api/v1/employees                 — list, with search/filter/pagination query params
GET    /api/v1/employees/:id             — detail
POST   /api/v1/employees                 — create
PATCH  /api/v1/employees/:id             — edit non-assignment fields (personal info etc.)
GET    /api/v1/employees/:id/assignments — full Employment Assignment history
POST   /api/v1/employees/:id/assignments — create a new assignment (the "transfer" action)
GET    /api/v1/employees/:id/timeline    — the audit-trail feed for the Timeline tab
GET    /api/v1/employees/:id/compensation — current + historical pay (permission-gated)
POST   /api/v1/employees/:id/compensation — new compensation record
```

Every one of these must run through the Module 21 permission-check layer before returning data — this is not optional, and it's why Module 1 and Module 21 are built in the same sprint pair.

## Components to use (Atlaskit)

Directory table: `@atlaskit/dynamic-table` (built-in sort/pagination). Detail page: `@atlaskit/tabs`, `@atlaskit/page-header`. Forms: `@atlaskit/form` + `@atlaskit/textfield`/`@atlaskit/select`/`@atlaskit/datetime-picker`. Transfer modal: `@atlaskit/modal-dialog`. Timeline: no direct Atlaskit component — build a simple custom component using `Box`/`Stack` primitives (check `@atlaskit/avatar`, `@atlaskit/lozenge` for status badges within it).

## What "done" looks like

Pulled directly from the module PRD's acceptance criteria — these are your actual Definition of Done, not a vibe check:

- Create an employee → they appear in the directory immediately, with a correctly-generated Employee ID.
- Transfer an employee → their Employee Detail page shows the new assignment as current, and the old one is visible (not deleted) in the Employment History timeline.
- Query "who was employee X's manager on [past date]" → returns the correct historical answer without needing to replay the audit log.
- A user without compensation-view permission → the Compensation tab is genuinely absent from their view, and hitting the API endpoint directly returns a 403, not just a hidden button.
