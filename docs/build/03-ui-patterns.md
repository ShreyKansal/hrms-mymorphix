# UI Patterns — when to use what

**Why this exists:** by the time Module 21 was built, the app had six-plus screens each making
its own call on tables, modals, and navigation, with no written rule tying them together. This
document is that rule set. Two different kinds of grounding, used deliberately in different
places: **audited** (what's actually built, checked for consistency — §1, §4, §5, §6, §9) where
the goal is catching drift between screens, and **researched** (external UX authorities, not
house opinion — §2's Modal/Page/Wizard thresholds) where the goal is checking whether the
existing pattern is actually *right*, not just *consistent*. Audited-only rules can accidentally
enshrine a mistake everywhere; that's what §2 is a correction of. When a new module needs a
pattern not covered here, add the decision to this file in the same PR — and say which kind of
grounding it has — don't just make the call silently.

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

**DynamicTable columns need explicit widths, not the library's default even split.** Found on
Employee Directory: an even split stretches every column to the same width regardless of what's
actually in it — a one-word Status column ends up as wide as Name, reading as sparse/unfinished
rather than deliberate (this is the concrete shape of "input fields ki width" as a complaint —
it's not only about form inputs). Set `width` (a percentage of the table's own width) per head
cell based on real content, e.g. Name wider than Status. And if a column is genuinely sortable
data, wire it up for real — `isSortable: true` per head cell, plus **`sortKey`/`sortOrder` fed
back into `DynamicTable` as controlled props**, not just an `onSort` callback. Without the
controlled props, the header's sort arrow never updates and a second click doesn't reverse
direction — DynamicTable has no way to know a column is "already sorted, so toggle" unless you
tell it back. A decorative sort arrow that doesn't actually toggle is worse than no arrow.

## 2. Modal vs. inline form vs. full page / wizard

**Revised after actual research, not just precedent** — the original version of this section
just described what was already built. That's circular: it can't catch "the thing we already
built is wrong." The thresholds below are from Nielsen Norman Group's wizard guidance and
Smashing Magazine's modal/page decision framework (both March 2026 or later — see sources),
not house opinion.

**Three tiers, by field count and task shape:**

| Tier | When | Today |
|---|---|---|
| **Inline form** | 1–4 fields, adding one row to a list already on screen. No context switch needed. | Add department/designation/grade (`OrgManagement.tsx`), education/previous-employment (`ProfileTab.tsx`), document upload (`DocumentsTab.tsx`), invite teammate (`Team.tsx`). |
| **Modal** | A short, self-contained, *single-purpose* task — not a multi-category form. Per Smashing Magazine's framework: modal only if the user doesn't need to reference other on-screen data, and the task is brief. **Never for "complex, lengthy multi-step tasks"** — that's their explicit rule, not a judgment call. | Transfer Employee (`TransferEmployeeModal.tsx`) — re-assessed below, this is the one case in the app that actually belongs here. |
| **Full page, likely a stepper/wizard** | NN/g's threshold: **more than 6–7 fields, OR fields that split into distinct categories** (e.g. contact info + work info + personal info), *and* the task is infrequent (not something the same user repeats constantly). Wizards specifically help here by breaking an overwhelming form into digestible, self-sufficient steps with visible progress. | Add Employee (`CreateEmployee.tsx`, route `/employees/new`) — 5 steps, see below. |

**Resolved: Create Employee.** Was `CreateEmployeeModal.tsx`, a 7-field Modal; rebuilt as a
full page with a stepper. This was the flagged violation — infrequent (once per hire), and its
real field groups split into genuinely distinct categories (personal, contact, work info,
education, previous employment) per the PRD's own Module 1 field list, not one topic. Zoho
People's Add Employee page (the competitor benchmark that prompted this review) is a full page
with sectioned/sub-tabled groups for exactly this reason. Steps, in order: **Personal & contact
→ Work information → Education → Previous employment → Review & create.** Education and
Previous employment are optional (repeatable, addable, removable — same inline-add UX as
`ProfileTab.tsx`'s own sections, just held in wizard state until the final step actually
creates the record) rather than forced stops. Documents is deliberately **not** a step: a
document upload needs a real `employee_id` (the storage path is tenant/employee-scoped, see
§9's storage RLS pattern), and `DocumentsTab.tsx` on the landing page already does this well —
duplicating that logic to run before the employee exists wasn't worth it. Wizard rules actually
applied, from NN/g: a persistent step indicator (`Stepper.tsx`, new shared component in
`src/lib/` since the next infrequent multi-step flow — Onboarding/Module 3, Separation/Module
15 — will want the same shape); enforced order (steps aren't clickable, no skipping ahead);
each step self-sufficient; Next/Previous labeled with the actual next step's name, not generic
text; and a non-admin never reaches the page at all (mirrors the existing hidden-button
pattern one step further — the route itself redirects, not just the entry point), consistent
with this doc's UX-is-not-security framing.

**Resolved: Transfer Employee, re-assessed and confirmed correct as a Modal.** Re-run against
the same researched criteria rather than assumed clean by association with Create Employee:
`TransferEmployeeModal.tsx` has 7 fields, right at NN/g's numeric edge, but they're **one
category, not several** — every field is "this employee's next assignment" (department,
designation, grade, manager, employment type, effective date, reason), not personal-vs-work-vs-
education the way Create Employee's fields split. Every field also defaults to the current
assignment's value, so a real transfer is usually a one- or two-field change, not a from-scratch
form fill. Per Smashing Magazine's decision tree: the user doesn't need to reference other
on-screen data mid-task, and the task is brief — neither test trips the "never a Modal for
complex, lengthy multi-step tasks" rule. Left as-is, deliberately, not by default.

## 3. Breadcrumbs and navigation

Navigation lives in two places, not per-page:

- **Sidebar** (`AppShell.tsx`) — persistent, left side, one entry per top-level destination
  (Employees, Organisation, Org Chart, Team). A page reachable directly from the sidebar
  **never** adds its own "back" link — the sidebar already answers "how do I get elsewhere."
  Slightly off-white background (`elevation.surface.sunken`), not plain white — separates it
  from page content without needing a visible border to do all the work. Nav items get real
  hover feedback (`NavItem` in `AppShell.tsx`, a small local-state pattern — see below), not
  just an active-state highlight; a sidebar item that doesn't react to a pointer over it reads
  as static chrome, not an interactive control, in every reference product checked (ClickUp,
  Attio, Qubit).
- **Sidebar search** (`SidebarSearch` in `AppShell.tsx`) — every competitor benchmark (ClickUp,
  Attio) puts a real search box at the top of the sidebar, not just a global omnisearch buried
  in a command palette. `Cmd/Ctrl+K` focuses it from anywhere (the shortcut every one of those
  products trains users to reach for), `Escape` clears it, outside-click closes the results
  dropdown. **Scoped to Employees today, deliberately** — that's the one module with a real,
  populated dataset; a search box that also claims to search Departments/Documents/whatever
  before those have real content behind them would be decoration, not a feature. Extend the
  scope in `SidebarSearch` as more modules get real, searchable data — don't build a fake
  all-modules search box ahead of that.
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

## 5. Spacing scale

A 4/8pt grid — every spacing value should be explainable as "N × 4px." Audited against actual
usage across every `margin`/`padding`/`gap` in the codebase before writing this down (not
prescribed first and hoped for): the app was already almost entirely on-grid (29 uses of 8px, 19
of 24px, 14 of 16px, consistent 4/8/12 elsewhere) with exactly one outlier — two `marginTop: 20`s
in `ProfileTab.tsx`, fixed to 24 as part of writing this section, not left as a "close enough."

| Value | Use |
|---|---|
| 4px | Micro spacing — tight icon-to-label gaps. |
| 8px | Tight spacing — gap between adjacent inline controls (e.g. a form field and its submit button), row padding in embedded tables. |
| 12px | Small vertical rhythm — rarely needed once 8/16 cover most cases. |
| 16px | Comfortable spacing — gap between a page's header row and its content. |
| 24px | Generous spacing — page container padding, section-to-section separation, action-row spacing above Save/Cancel/Edit buttons. |
| 32px+ | Major separation — not yet needed anywhere; reserve for genuinely large structural gaps if one shows up. |

If a new value doesn't land on this scale, that's the signal to round to the nearest step, not
to add a one-off number.

## 6. Shared style constants

`src/lib/detailStyles.ts` (`labelStyle`, `valueStyle`, `rowStyle`, `cellStyle`) — the styling for
the field-label/value pairs and small embedded tables described in §1 and §4. This used to be
copy-pasted identically into five separate files (`ProfileTab`, `EmploymentTab`, `DocumentsTab`,
`OrgManagement`, `Team`); not yet drifted when consolidated, but five copies of the same object
is exactly how drift starts. **Import from here, don't redeclare** — if a screen needs a
genuinely different look for these, that's a signal to extend `detailStyles.ts` with a named
variant, not to fork a local copy.

## 7. Forms

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

**A second real bug in the same component, found by the Create Employee wizard's browser
verification:** the rendered `<select>` had no `display` set, so it defaulted to the browser's
native `inline-block`. A `Field`'s own label isn't block-level on its own — `TextField`'s label
only ever appeared to stack correctly above it because `TextField`'s wrapper is block-level and
forced the line break; `SelectField` had no such wrapper, so the select just continued on the
same line as its label instead. Every existing `SelectField` usage had this (Transfer Employee,
Team's invite-role picker) — it just took a page with several selects stacked in a plain
(non-flex) `FormSection` to make it visually obvious. Fixed with one `display: 'block'` in the
shared component, verified against both the Work Information step (stacks correctly now) and
Team's flex-row invite form (still lays out side-by-side correctly, not stretched to 100%).

**A single-column form where every field stretches to the page's full width reads as
unfinished, not spacious.** Found on the Create Employee wizard: inside an 864px page, a
one-word "Gender" or "PAN" field stretching the full 864px looked broken, not generous — real
SaaS forms (Attio, Linear) cap field width and pair short fields side by side. Pattern now used
in `CreateEmployee.tsx` (`formGridStyle`/`fullWidthFieldStyle`): a `display: grid,
gridTemplateColumns: repeat(2, minmax(0, 1fr))` wrapper capped at `maxWidth: 640` inside each
`FormSection`, wrapping each `<Field>` (or a `gridColumn: '1 / -1'` wrapper for the rare field
that deserves its own row, e.g. a name). Pair fields that are genuinely short (date, single
word, a short id) two-to-a-row; give a field its own row only when its content could plausibly
be long. Apply this to any future multi-field form section — the old single-column stack was
never a deliberate choice, just what `FormSection`'s own default layout does if left alone.

## 8. Status and category labels

`@atlaskit/lozenge` for any short status/role/category tag. Current appearance convention:

| Meaning | Appearance |
|---|---|
| Active / current / admin (positive, "this is the good state") | `success` |
| Draft / other / employee / default state | `default` (or omitted — same visual) |

Only two states have been needed so far (`EmployeeDirectory.tsx`'s status Lozenge,
`Team.tsx`'s role Lozenge, `EmploymentTab.tsx`'s "current" marker). Extend this table when a
module needs more — e.g. a `warning`/`removed` appearance for `suspended`/`separated` employee
statuses — rather than picking an appearance ad hoc per screen.

## 9. Page container width

- **864px** (`maxWidth: 864`) for form-and-detail pages — Employee Detail, Organisation, Team,
  Tenant Setup. These are read-and-edit pages, not dense data views; a narrower column is more
  readable.
- **1296px** (`maxWidth: 1296`) for dense list/table pages — Employee Directory, Org Chart.
  These want the horizontal room a table or a wide tree actually needs.

Both use `margin: '0 auto'` to center within the (already-narrower) `AppShell` main content area.

**Detail-page headers get an avatar, not just stacked text.** Found missing on Employee Detail
— a record-detail page with just a name and a status line, no visual anchor, reads as a plain
document rather than a person's profile (every reference product puts a face/initials circle at
the top of a person-record page). Pattern: `initials()` + a small fixed palette
(`AVATAR_COLORS` in `EmployeeDetail.tsx`) hashed from the record's name, so the same person
always gets the same color without needing a real photo-upload feature to back it — that's real,
separate scope (a `documents`-style upload wired specifically to a profile-photo field), not
something to half-build as a placeholder here. Apply the same pattern to the next
person-or-org-record detail page this app grows (e.g. a future Vendor/Candidate detail page).

## 10. Module folder structure

Covered in memory, not repeated here in full: one folder per HRMS module under
`src/modules/<module-slug>/`, only as many files as the module genuinely needs, cross-module
shared infra in `src/lib/`. See the `feedback-module-folder-structure` memory for the full
rationale if this file is being read outside a session that already has it loaded.

---

## Sources

External research behind §2 (Modal/Page/Wizard) and the spacing-scale numbers in §5:

- [Nielsen Norman Group — Wizards: Definition and Design Recommendations](https://www.nngroup.com/articles/wizards/) — when to use a wizard, and the design rules for one (progress indication, sequential navigation, self-sufficient steps).
- [Smashing Magazine — Modal vs. Separate Page: UX Decision Tree](https://www.smashingmagazine.com/2026/03/modal-separate-page-ux-decision-tree/) — the 4-step decision framework §2 is built on (context maintenance, task complexity, background reference needs, overlay type).
- 4/8pt spacing grid (§5) and the typography-scale framing (§4) are standard, widely-used
  conventions in production design systems (not attributed to a single source) — verified against
  this codebase's actual usage before being written down, not applied blind.
