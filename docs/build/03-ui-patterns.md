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
| **Modal** | A short, self-contained, *single-purpose* task — not a multi-category form. Per Smashing Magazine's framework: modal only if the user doesn't need to reference other on-screen data, and the task is brief. **Never for "complex, lengthy multi-step tasks"** — that's their explicit rule, not a judgment call. | Nothing in the app currently fits this tier cleanly (see below). |
| **Full page, likely a stepper/wizard** | NN/g's threshold: **more than 6–7 fields, OR fields that split into distinct categories** (e.g. contact info + work info + personal info), *and* the task is infrequent (not something the same user repeats constantly). Wizards specifically help here by breaking an overwhelming form into digestible, self-sufficient steps with visible progress. | **Not built yet — this is the gap.** |

**Known violation, not yet fixed:** `CreateEmployeeModal.tsx` and `TransferEmployeeModal.tsx`
are both Modals today, and both fail this rule. Create Employee is a textbook wizard candidate —
infrequent (once per hire), and the PRD's own Module 1 field groups (personal, contact,
government IDs, work info, education, previous employment, assets) are exactly the "distinct
categories" trigger NN/g describes. It currently only has 7 fields because that's all that's
been built, not because 7 is the real scope — Zoho People's own Add Employee page (a direct
competitor benchmark) is a full page with six sections and embedded sub-tables for Education,
Experience, and Assets. **Flagged here deliberately rather than silently left as "the modal
works fine"** — rebuilding this as a full-page, section-or-stepper flow is a real, sized piece
of work, not a quick fix, and should be planned as its own task rather than folded into
something else.

Wizard design rules, once this gets built (from NN/g, don't reinvent):
visible step/progress indicator; enforced step order — no skipping ahead; each step
self-sufficient (no needing to remember something from a different step); "Next"/"Previous"
labeled with the actual step name, not generic labels; and — importantly — **don't wizard-ify
things a user does constantly**. Wizards are for infrequent, complex, one-shot tasks; forcing a
frequent action through a multi-step flow is friction NN/g explicitly warns against.

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
