# Supabase Design System — Notes

**Why this exists:** the app is switching its component/styling layer from Atlaskit to Radix UI
+ Tailwind CSS (Supabase's own architecture — Radix primitives, `cva` variants, Tailwind
utilities), keeping only Atlaskit's actual color tokens and fonts. These are original notes
summarizing Supabase's public design-system docs (supabase.com/design-system/docs, Apache-2.0
licensed) — patterns, prop shapes, and usage guidance to build from — not a copy of their
source tree. The actual application code in this repo (`apps/web/src/components/ui/*`,
`AppShell.tsx`, `CommandPalette.tsx`, etc.) is written fresh, using these patterns with
entirely different values (Atlaskit's measured colors/fonts, not Supabase's brand palette).

**Do not delete `apps/web`'s existing Atlaskit-based code when the migration starts.** It's
being kept for reference/fallback, not replaced-and-discarded — explicit instruction.

---

## System overview

- **What it is:** "Components and patterns that you can copy and paste into Supabase apps.
  Accessible. Customizable. Open Source." Not a themeable installed package — copy-paste
  components, shadcn/ui-style.
- **Built on:** Radix UI (component primitives) + Tailwind CSS (styling) + React. Source on
  GitHub under the Supabase org.
- **Philosophy inspirations:** Radix UI, shadcn/ui, Geist.

## URL structure (confirmed by direct fetch, not guessed)

- Getting Started pages: `https://supabase.com/design-system/docs/{slug}` (root level — e.g.
  `/docs/typography`, `/docs/theming`, `/docs/color-usage`, `/docs/tailwind-classes`)
- UI Patterns: `https://supabase.com/design-system/docs/ui-patterns/{slug}`
- Fragment Components: `https://supabase.com/design-system/docs/fragments/{slug}`
- Atom Components: `https://supabase.com/design-system/docs/components/{slug}`

## Full page inventory (for tracking extraction completeness)

**Getting Started:** Introduction, Accessibility, Color Usage, Copywriting, Icons, Tailwind
Classes, Theming, Typography — *Typography and Theming extracted below; rest in
`01-getting-started-remaining.md`.*

**UI Patterns:** Introduction, Charts, Connect Interstitials, Empty States, Forms, Layout,
Markdown, Modality, Navigation, Tables — *Modality/Forms/Layout/Tables/Navigation/Empty States
extracted below; rest in `02-ui-patterns-remaining.md`.*

**Fragment Components (25):** Introduction, Admonition, Assistant Chat, Collapsible Alert,
Collapsible Card Section, Confirmation Modal, Data Input, Empty State Presentational, Error
Display, Filter Bar, Form Item Layout, Info Tooltip, Inner Side Menu, Key/Value Field Array,
Logs Bar Chart, Metric Card, Multi Select, Page Breadcrumbs, Page Container, Page Header, Page
Nav, Page Section, Single Value Field Array, Status Codes, Table of Contents, Text Confirm
Dialog — *Confirmation Modal extracted below; rest in `03-fragments.md`.*

**Atom Components (62):** Introduction, Accordion, Alert, Alert Dialog, Aspect Ratio, Avatar,
Badge, Breadcrumb, Button, Calendar, Card, Carousel, Checkbox, Collapsible, Combobox, Command,
Command Menu, Context Menu, Date Picker, Dialog, Drawer, Dropdown Menu, Expanding Textarea,
Field, Form, Hover Card, Input, Input OTP, Keyboard Shortcut, Label, Menubar, Mermaid, Nav Menu,
Navigation Menu, Pagination, Popover, Progress, Radio Group, Radio Group Card, Radio Group
Stacked, Resizable, Scroll Area, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner,
Success Check, Switch, Table, Tabs, Textarea, Toggle, Toggle Group, Tooltip, Tree View —
*Button extracted below; rest split across `04-components-a-m.md` / `05-components-n-z.md`.*

---

## Already-extracted page content

### UI Patterns → Modality

**When to use each component:**
- **Modals (general):** "Present ephemeral information and demand action" — interrupts the
  user, renders underlying content inactive.
- **Dialogs:** short, focused tasks. Reiterative (header/confirm-button text matches the
  action), simple (no layered subtitles/admonitions unless necessary), accessible (semantic
  HTML + correct ARIA).
- **Sheets:** larger content — multi-field forms, editors, settings panels, detailed views.
  Default: slide in from the right unless there's a strong reason otherwise.

**Dialog types:**
- **Alert Dialog** — single-paragraph confirmations for critical actions.
- **Text Confirm Dialog** — high-risk actions requiring a typed confirmation string.
- **Confirmation Modal** — confirmations needing extra context/callouts/form elements.
- **Dialog** — general-purpose bespoke flows.

**Dirty-form dismissal flow (best practice):**
1. User attempts to close.
2. If the form is clean, close immediately.
3. If dirty, show a discard-confirmation dialog.
4. "Keep editing" returns to the form; "Discard changes" closes and resets.

Implementation notes: keep dismissal affordances enabled (backdrop click, Escape, close icon);
guard controlled close attempts only; don't block route changes arbitrarily.

### UI Patterns → Forms

**Layout & structure:**
- Page layouts: `PageSection` components with `Card` containers.
- Fields use `FormItemLayout` with `layout="flex-row-reverse"` for horizontal alignment.
- Side panels: wider panels use `layout="horizontal"` on `FormItemLayout`; smaller panels
  (size `sm` or below) use `layout="vertical"`. Wrap forms in `Sheet` with `SheetContent`,
  `SheetHeader`, `SheetFooter`.

**Field organization:** group related fields within `Card` > `CardContent`; separate sections
with `Separator` in side panels; use `SheetSection` to organize side-panel content.

**Labels & required indicators:** always use `FormItemLayout` instead of hand-composing labels;
include `label`/`description` props for context. No explicit required-field-indicator
convention documented; validation surfaces via `FormMessage`.

**Validation & errors:** always use `FormControl` to wrap inputs; errors via the form
validation system (a Zod-schema example is shown); `fieldState.invalid` conditionally styles
inputs.

**Buttons & actions:** action buttons live in `CardFooter` (page layouts) or `SheetFooter`
(side panels). Show cancel buttons; disable save buttons based on `form.formState.isDirty`. Use
the `form` prop to reference a form when buttons sit outside the `<form>` element. Submit
buttons get a `loading` prop for async operations.

### UI Patterns → Layout

**Container widths (three tiers, real meaning attached to each):**
- **`small`** — settings, forms, focused configuration (including child pages under a settings
  parent).
- **`default`** — lists, tables, detail pages that stay readable without full viewport width.
- **`full`** — dense horizontal content: logs, code, editors, charts, tables that need the
  viewport. Routes can mix widths across child pages (a full-width parent can contain
  small-width settings tabs and full-width logs tabs).

**Core page structure, in order:**
1. `PageBreadcrumbs` — full-width bordered row at top. "Breadcrumbs first... Place it as a
   sibling above `PageHeader` — not inside."
2. `PageNav` (optional) — sub-navigation below breadcrumbs, aligned top-left.
3. `PageHeader` (optional) — title block with metadata.
4. `PageContainer` — applies width + padding based on content type.
5. `PageSection` — titled content blocks.

**Page header patterns:** include `PageHeaderMeta` (title/description) only when context helps;
omit when the work area is self-explanatory (e.g. logs with filters + a table). `PageHeaderAside`
holds actions when there's no filter row.

**Section orientation:** `PageSection` supports a horizontal layout ("a summary sits beside
content") — useful for detail pages grouping related information.

**Action placement rules:**

| Situation | Location |
|---|---|
| Parent with sub-navigation | `PageBreadcrumbsActions` on the breadcrumb row |
| Child with header meta, no filter | `PageHeaderAside` |
| Table/list with a filter row | Right side of the filter row (not the header) |
| Simple list, no filter | `PageHeaderAside` or `PageSectionAside` |
| Compact chrome (logs) | Breadcrumb row or in-page controls |

**Spacing/density:** no explicit grid values published on this page. Observed usage: `space-y-4`
for form-field stacking, `gap-6` for grid layouts within sections, card padding typically `p-4`
to `p-6` (Tailwind's default scale — 4px increments: `p-4`=16px, `p-6`=24px, `gap-6`=24px,
`space-y-4`=16px).

**Special patterns:**
- Settings pages: single column, `PageSection` groups sized `small` or `default`.
- Parent pages with sub-nav: omit `PageHeader`; breadcrumbs name the parent; child routes
  render their own header.
- Full-width views (logs, code): skip `PageHeader` when a title block isn't needed; keep top
  chrome compact.

### UI Patterns → Tables

**Component selection (three tiers):**
- **Table** — simple, static tabular data, read-only, no sort/filter.
- **Data Table** — sorting, pagination, filtering, search, row actions (built on TanStack
  Table).
- **Data Grid** — virtualization, column resizing, spreadsheet-like editing, for large
  datasets.

**Visual specs:** Data Grid example: `rowHeight={44}` for data rows, `headerRowHeight={36}` for
headers. Header styling uses borders (`border-default border-r border-b`); sortable headers
implement three-state cycling (ascending → descending → none).

**Column management:** Data Table example shows column-visibility controls (show/hide via
dropdown menu); columns support text alignment (`text-right` for numeric values).

**Pagination:** Previous/Next controls, button `disabled` state tied to `getCanPreviousPage()`/
`getCanNextPage()` — not numbered-page pagination.

**Empty states:** "No results found" with secondary text ("Your search did not return any
results") when a filtered query returns zero rows.

**Selection:** checkboxes in a dedicated column (50px width), indeterminate state for
partial-page selection.

**Future direction (stated intent, not yet shipped):** consolidating Data Table + Data Grid
into one component with virtualization, resizable columns, plug-in cell editors, and
accessible semantic HTML table markup.

### UI Patterns → Navigation

**NavMenu:** primary pattern — "a horizontal list of related views within a consistent
PageLayout context." Activating an item triggers a URL change (not just local state).

**Browser page-title hierarchy** (most → least specific):
`Entity | Section | Surface | Project | Org | Supabase`
Example: `users | Table Editor | My Project | My Org | Supabase`.

**Implementation best practices:** use shared title-formatting utilities, not ad hoc assembly;
prefer `ProjectLayout` for project-scoped pages; use explicit `title` props when layout
wrappers expose them; `product` is the single source of truth for the project-level surface
segment; reserve `browserTitle.entity` for the most specific resource (tables, functions,
queries).

### UI Patterns → Empty States

**Layout:** presentational (first-encounter) states benefit from lightweight feature
education/onboarding. Data-heavy views should keep populated/empty states visually consistent
to avoid layout shift on transition.

**Icons:** presentational empty states pair an illustrative icon (e.g. `BucketPlus`, `Users`)
with a descriptive title. Data grids may show a centered icon + explanatory text overlay.

**Copy tone:** active, action-oriented language for presentational states — "Create a vector
bucket," not "No vector buckets found." The passive/transactional phrasing is fine for
table-based contexts where users expect it.

**CTA placement:** primary action sits prominently within a presentational empty state, usually
beneath the description. For zero-result tables, actions typically sit above the table
container. Data grids may center the CTA inside the empty-state overlay.

**Specific patterns:**
- Tables: single row, muted headers, disabled hover states.
- Data grids: centered overlay — icon, title, description.
- Missing routes: centered admonition-style component with a navigation option.

### Getting Started → Typography

Thin page — mostly a navigation hub, not a full spec. What's actually there:
- `text-code-inline` — apply to a `code` element for inline code/custom inline content.
- `text-brand-link` — Supabase-green text, contrast-checked for light and dark modes.

Explicitly missing from the page itself: font-family spec, type scale (sizes/weights/
line-heights), heading hierarchy. Points to
[`typography.scss`](https://github.com/supabase/supabase/blob/master/apps/studio/styles/typography.scss)
on GitHub for the real implementation, and notes patterns are "composed of core Tailwind
utility classes" — i.e., defer to Tailwind's own type scale for anything not explicitly
overridden. **Not fetched yet in this pass** — worth pulling `typography.scss` directly if the
migration needs exact heading sizes (we're keeping Atlaskit's type scale per this migration's
scope, so this may be moot — flagged for the migration-planning step, not re-extraction).

### Getting Started → Theming

**Available themes:** Light, Dark ("Classic dark"), Deep dark, System (auto-switches with OS
preference).

**Migration strategy (their own, in progress):** moving to "tailwind classes that use CSS
properties" so the team can retheme without touching hundreds of files, and to support custom/
additional themes later.

Doesn't contain concrete CSS variable definitions or color-token values on this page — points
to Color Usage and Tailwind Classes pages (in `01-getting-started-remaining.md`) for those.

### Fragment Components → Confirmation Modal

**Purpose:** a structured dialog wrapper for confirmations that need more context than a plain
yes/no.

**When to use:** confirmation needs extra body content (multiple paragraphs, callouts, simple
supporting controls); moderate complexity, not requiring typed confirmation.

**When NOT to use:** short/critical confirmations → Alert Dialog instead; dirty-form dismissal
→ `DiscardChangesConfirmationDialog` for consistency; highly destructive actions → Text Confirm
Dialog; complex multi-step flows → a custom Dialog component.

**Structure:** keep content focused on the decision only; clear/descriptive confirm/cancel
labels; only necessary supporting info; avoid full workflows or irreversible high-risk actions
inside it.

**Props:** `visible`, `title`, `description`, `variant` (`'default' | 'destructive' | 'warning'`),
`loading`, `onConfirm`, `onCancel`, `alert`, `children` (children carry body content — text,
forms, selects, callouts).

### Atom Components → Button

**Variants (8):**
1. **Primary** — data-insertion actions, confirming purchases, strong positive actions.
2. **Default** — dialogs and page navigation; likely the most-used variant.
3. **Secondary** — signals data/config changes; lighter than primary.
4. **Warning** — actions with potential side effects.
5. **Destructive** — actions with a serious destructive side effect (e.g. deleting data).
6. **Outline** — secondary/less-important actions.
7. **Ghost** — non-critical actions.
8. **Link** — minimal-emphasis actions.

**Sizes (5):** Tiny, Small, Medium, Large, Huge.

**States:** Rest (default); Loading (loading indicator); Icon (`icon` left / `iconRight` right
props); Disabled (automatically gets `tabIndex={-1}`).

**Usage rules:** icon-only buttons need improved component support (their own caveat); split
buttons with a dropdown use `rounded-r-none` on the primary button and `rounded-l-none` on the
trigger; can act as a link via the `buttonVariants()` helper or `asChild` prop; keyboard focus
is automatic — don't manually set `tabIndex`.
