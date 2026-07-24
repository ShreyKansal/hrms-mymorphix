# UI Patterns — when to use what

**Why this exists:** by the time Module 21 was built, the app had six-plus screens each making
its own call on tables, modals, and navigation, with no written rule tying them together. This
document is that rule set — grounded in what's already built (audited, not invented), so new
modules extend a real pattern instead of adding a seventh variant. When a new module needs a
pattern not covered here, add the decision to this file in the same PR, don't just make the call
silently.

---

## 1. Tables: `@atlaskit/dynamic-table` vs. a plain `<table>`

**Use `@atlaskit/dynamic-table`** for a list that is itself a primary, standalone destination —
something a user navigates *to* in order to browse/search a whole collection of records, that
could plausibly grow to dozens or hundreds of rows, and where sorting/pagination earns its
complexity.

- **Today:** Employee Directory (`EmployeeDirectory.tsx`) is the only one. It's the canonical
  primary-list screen: full-tenant employee collection, a real navigation target from the
  sidebar, genuinely unbounded row count.
- **Reference for the next one:** the Team page's Members list (`Team.tsx`) *should* have used
  DynamicTable by this rule — it didn't, because it predates this document. Left as a plain
  table for now (it's short — one row per teammate, most tenants have a handful); revisit if a
  tenant's member list actually grows enough to need sort/search.

**Use a plain `<table>`** for a list that is secondary content embedded *within* another page —
not a destination itself, always small and bounded (rarely more than a handful of rows in
practice), and existing only to display something in service of the page it's on.

- **Today:** Employment History (`EmploymentTab.tsx`), Education and Previous Employment
  (`ProfileTab.tsx`), Documents (`DocumentsTab.tsx`), Departments/Designations/Grades
  (`OrgManagement.tsx`), pending invitations (`Team.tsx`). All of these are "one section of a
  page," not "the reason you navigated here."

If a plain-`<table>` list starts accumulating its own sort/filter/pagination needs, that's the
signal it's outgrown this rule and should move to DynamicTable — don't add ad hoc sort/filter
code to a plain table instead.

## 2. Modal vs. inline form

**Use a Modal** (`@atlaskit/modal-dialog`) for a multi-field action, triggered from a list or
detail view, that represents a deliberate, complete task the user is stepping away from the page
to perform — Atlaskit's own guidance: a Modal is for one focused task, not a container for
"more stuff."

- **Today:** Create Employee (`CreateEmployeeModal.tsx` — 7 fields, triggered from the
  Directory), Transfer Employee (`TransferEmployeeModal.tsx` — 7 fields, triggered from the
  Employment tab). Both are genuinely multi-step decisions (who reports to whom, which
  department, effective date, reason) that benefit from the focus a Modal provides, and neither
  is something you'd want half-visible behind the list you triggered it from.

**Use an inline form** (appearing directly in the page, right below the list it adds to) for a
quick, low-friction addition of 1–4 fields to a list the user is already looking at — adding
Modal ceremony here is friction, not focus.

- **Today:** adding a department/designation/grade (`OrgManagement.tsx`), adding an
  education/previous-employment record (`ProfileTab.tsx`), uploading a document
  (`DocumentsTab.tsx`), inviting a teammate (`Team.tsx`). None of these need the user's full
  attention pulled away from the list — they're adding one row to something already in view.

Rule of thumb: **>5 fields or a genuinely separate task → Modal. ≤4 fields adding to a list
already on screen → inline.** If a "quick add" grows past ~4 fields over time, promote it to a
Modal rather than letting the inline form sprawl.

## 3. Breadcrumbs and navigation

Navigation lives in two places, not per-page:

- **Sidebar** (`AppShell.tsx`) — persistent, left side, one entry per top-level destination
  (Employees, Organisation, Org Chart, Team). A page reachable directly from the sidebar
  **never** adds its own "back" link — the sidebar already answers "how do I get elsewhere."
- **Breadcrumb trail** (`AppShell.tsx`'s header, top bar) — one horizontal trail showing where
  the current page sits, in the Supabase/Jira-dashboard style (`Employees / Jane Doe`), not a
  link buried in the page body. Static routes get a one-word label from a lookup map
  (`breadcrumbLabels` in `AppShell.tsx`); the one dynamic route (`/employees/:id`) gets its
  final segment from the detail page itself via `usePageTitleStore` (`pageTitleStore.ts`) —
  set the title once the record loads, clear it on unmount. Follow this same pattern for any
  future `/module/:id` detail route rather than inventing a new breadcrumb mechanism.

**When a page still needs an in-body "back" link:** only for genuine drill-downs — a record
reached by clicking *into* something from a list, where the sidebar's top-level entry isn't
specific enough (e.g. Employee Detail, reached from the Directory). Even then, prefer the
breadcrumb trail as the primary way back; an in-body link is a bonus, not required going
forward now that the breadcrumb exists.

**Why not React Router's `useMatches()`/`handle`:** that API only works with the "data router"
(`createBrowserRouter` + `RouterProvider`). This app uses the classic `<BrowserRouter>` +
`<Routes>` API, and migrating the whole router for breadcrumbs wasn't worth it — a `useLocation()`
+ static label map does the same job at this route-tree size. Reconsider only if the route tree
grows enough to need real nested-route data loading (loaders/actions), not for breadcrumbs alone.

## 4. Typography hierarchy

`@atlaskit/heading`'s `size` prop, used consistently — this drifted once already
(`EmployeeDetail.tsx`'s record-name heading was `xlarge` while every other page title was
`large`; fixed, but the fix is only worth something if the next page doesn't reintroduce it):

| Level | Size | Where |
|---|---|---|
| Page title | `large` | Every page's H1-equivalent — Employee Directory, Employee Detail (the record name), Organisation, Org Chart, Team, Auth, Tenant Setup. **Never `xlarge`** — that was the one drift found so far. |
| Section header | `small` | A named section within a page — "Personal", "Education", "Current assignment", "Members", "Pending invitations". Every section header in the app already uses this; keep it that way. |
| Field label / row label | 12px, `#626F86`, weight 600 | Not a `Heading` at all — small inline labels like "Legal name" or "Department" above a value. See `src/lib/detailStyles.ts`'s `labelStyle`. |

There is no `medium` or in-between size in use anywhere — don't introduce one without adding it
to this table first.

## 5. Shared style constants

`src/lib/detailStyles.ts` (`labelStyle`, `valueStyle`, `rowStyle`, `cellStyle`) — the styling for
the field-label/value pairs and small embedded tables described in §1 and §4. This used to be
copy-pasted identically into five separate files (`ProfileTab`, `EmploymentTab`, `DocumentsTab`,
`OrgManagement`, `Team`); not yet drifted when consolidated, but five copies of the same object
is exactly how drift starts. **Import from here, don't redeclare** — if a screen needs a
genuinely different look for these, that's a signal to extend `detailStyles.ts` with a named
variant, not to fork a local copy.

## 6. Forms

Always `@atlaskit/form` (`Field`/`FormSection`/`ErrorMessage`/`MessageWrapper`) — required-field
asterisks and inline validation come from the library, never hand-rolled. For any `<select>`,
always use the shared `src/lib/SelectField.tsx` wrapper, never spread `fieldProps` directly onto
a native `<select>` — see that file's comment for the two real bugs (DOM-attribute leakage,
wrong `onChange` type) doing so caused, and for why it's now visually styled to match
`TextField` rather than rendering as a bare native control ("dropdowns are small" was a real,
reported inconsistency — `SelectField` now measures 40px tall, 3px corner radius, 1px border in
`color.border.input` at rest / `color.border.focused` on focus, all read from `@atlaskit/tokens`
rather than hardcoded so it stays theme-correct — pixel-matched against a live `TextField`
render, not eyeballed).

## 7. Status and category labels

`@atlaskit/lozenge` for any short status/role/category tag. Current appearance convention:

| Meaning | Appearance |
|---|---|
| Active / current / admin (positive, "this is the good state") | `success` |
| Draft / other / employee / default state | `default` (or omitted — same visual) |

Only two states have been needed so far (`EmployeeDirectory.tsx`'s status Lozenge,
`Team.tsx`'s role Lozenge, `EmploymentTab.tsx`'s "current" marker). Extend this table when a
module needs more — e.g. a `warning`/`removed` appearance for `suspended`/`separated` employee
statuses — rather than picking an appearance ad hoc per screen.

## 8. Page container width

- **864px** (`maxWidth: 864`) for form-and-detail pages — Employee Detail, Organisation, Team,
  Tenant Setup. These are read-and-edit pages, not dense data views; a narrower column is more
  readable.
- **1296px** (`maxWidth: 1296`) for dense list/table pages — Employee Directory, Org Chart.
  These want the horizontal room a table or a wide tree actually needs.

Both use `margin: '0 auto'` to center within the (already-narrower) `AppShell` main content area.

## 9. Module folder structure

Covered in memory, not repeated here in full: one folder per HRMS module under
`src/modules/<module-slug>/`, only as many files as the module genuinely needs, cross-module
shared infra in `src/lib/`. See the `feedback-module-folder-structure` memory for the full
rationale if this file is being read outside a session that already has it loaded.
