# 00 — Existing System Audit

**Status:** Complete (for what exists to audit)
**Last updated:** 2026-07-23
**Audited path:** `/Users/shreykansal/Downloads/Automation/atlassian-design-system/`

---

## 0. Headline finding

> **There is no existing HRMS application repository.** The only pre-existing asset in the workspace is a **165-file local Markdown mirror of [atlassian.design](https://atlassian.design)** — the public documentation site for the **Atlassian Design System (Atlaskit)**. It contains zero application code: no `package.json`, no `.git`, no `src/`, no server, no database, no build config. It is a **reference corpus**, not a codebase.

This changes the shape of Phase 1. Instead of auditing "what the existing app does," this document audits **what UI toolkit the new HRMS is contractually required to build on**, and flags every category from the requested audit checklist that **cannot be answered** because no application exists yet — those become inputs to Phase 9 (data model), Phase 10 (API planning) and Phase 12 (NFRs) as open architectural decisions, not existing constraints.

Everything below is separated into **Confirmed (found in the repo)** vs **Assumption** vs **Open Question** per the working rules.

---

## 1. What the repo actually is

**Confirmed** (from `atlassian-design-system/README.md`):

- A local extract of atlassian.design, built from three sources, ranked by authority:
  1. `foundations/color.md`, `base-palette.md`, `spacing.md`, `typography.md`, `shape-radius.md`, `motion.md` — pulled directly from the **`@atlaskit/tokens`** npm package's raw token artifacts (exact hex/px/rem/duration values, light + dark).
  2. `components/*.md` — usage/content/accessibility guidance sourced from each `@atlaskit/*` package's `docs.tsx` structured-content file, with code examples extracted from the live docs site's rendered `<code>` blocks (real, not synthesized).
  3. Everything else (Foundations prose, Get Started, Rovo UI) — extracted via direct fetch of server-rendered page content.
- 165 files across four top-level sections: `foundations/`, `get-started/`, `rovo-ui/`, `components/` (~90 components).
- No `.git`, no `package.json`, no lockfile, anywhere in the tree.

**Assumption:** the actual HRMS product will be built as a **new application** that consumes the real `@atlaskit/*` npm packages (React components), using this Markdown corpus purely as an offline reference for API shapes, usage rules, and content/accessibility guidelines during implementation. This is not stated by the user but is the only interpretation consistent with "I already have a design system... the final product must use the existing design system consistently" combined with there being no app to modify.

**Open question:** Is Atlaskit intended to be consumed directly via its public npm packages (`@atlaskit/button`, `@atlaskit/form`, etc.), or does the organisation have an internal fork/wrapper package? Atlaskit's components and some patterns (e.g. `navigation-system`) reference "Atlassians only" internal resources (Figma libraries behind `go.atlassian.com` links, internal a11y tooling), which implies the source site is Atlassian's *internal* design system surface, not just the public marketing subset. **Confirm licensing/access terms before taking a dependency on `@atlaskit/*` in a non-Atlassian product** — Atlaskit packages are published on the public npm registry but are designed and maintained for Atlassian's own products; using them wholesale in a third-party commercial HRMS is an open legal/support-risk question, not a resolved one.

---

## 2. Audit against the requested checklist

| Item requested | Finding |
|---|---|
| Existing frontend framework | **Confirmed: React** (all code examples are React/TSX; `@atlaskit/*` packages are React component libraries). No Vue/Angular/Svelte references anywhere. |
| Existing backend framework | **None exists.** No server code, no API layer, nothing. This is a green-field decision — see Phase 9/10. |
| Existing database | **None exists.** Green-field decision — see Phase 9 (conceptual data model). |
| Existing folder structure | N/A — no app. The *reference corpus's* structure is `foundations/`, `get-started/`, `rovo-ui/`, `components/` (mirroring the site's IA, not an app's). |
| Existing authentication mechanism | **None exists.** Green-field — see Phase 11. |
| Existing design system components | **Confirmed** — see §3 below for full inventory as observed. |
| Typography, spacing, colour, layout rules | **Confirmed**, sourced from real token artifacts — see §4. |
| Existing form components | **Confirmed** — `@atlaskit/form` ecosystem, see §5. |
| Existing table components | **Confirmed** — two distinct table primitives, see §6. |
| Modal, drawer, detail-page patterns | **Confirmed** for modal and drawer; **no detail-page pattern exists** in the corpus (Atlaskit is a component library, not a page-template library) — detail-page layout is a product-level decision the HRMS PRD must make (see Phase 8, Information Architecture). Drawer is **deprecated upstream** — see §7. |
| Existing validation libraries | **Confirmed**: `@atlaskit/form`'s built-in `validate` prop pattern (sync/async, field-level + submission-level). No external validation library (e.g. Zod/Yup) is referenced anywhere in the corpus — see §5. |
| Existing API conventions | **None exist.** Green-field — see Phase 10. |
| Existing state-management approach | **None exists** at the application level. `@atlaskit/form` has its own internal form-state (`useFormState` hook); no global state library (Redux/Zustand/Jotai/etc.) is referenced. Green-field decision for the HRMS app shell. |
| Existing testing setup | **None exists.** No test files, no test runner config. Green-field — see Phase 12 (NFRs) for a proposed baseline. |
| Existing deployment configuration | **None exists.** Green-field. |
| Existing reusable components | **Confirmed** — ~90 components + a `primitives/` layer (Box, Stack, Flex, Inline, Grid, Bleed, Anchor, Pressable, Text) intended as the low-level composition layer under the higher-level components. |
| Existing accessibility standards | **Partially confirmed** — a documented set of accessibility *principles* exists (see §8), but no explicit WCAG conformance target (e.g. "2.2 AA") is stated anywhere in the corpus. Treat WCAG 2.2 AA as **this PRD's proposed target** (Phase 12), not an inherited standard. |
| Existing responsive breakpoints | **Confirmed** — a 6-tier breakpoint system, see §9. |
| Existing dark-mode support | **Confirmed** — first-class, token-driven (light + dark hex values ship for all 466 semantic colour tokens). |
| Technical limitations or inconsistencies | See §10. |

---

## 3. Component inventory (as observed)

Grouped by function, from the `components/` directory listing (90 files/dirs). Status annotations (`general-availability`, `deprecated`, `intent-to-deprecate`) are **confirmed** only for the handful of files actually opened during this audit (marked below); all others are **unverified — status not yet checked per component**, and should be spot-checked before the HRMS team commits to any one of them for a load-bearing pattern.

- **Actions & inputs:** button (+ button-group, icon-button, link-button, link-icon-button, split-button, legacy), checkbox, radio, select, textfield, textarea, toggle, range, inline-edit, datetime-picker
- **Forms:** form ✅ *(opened — GA, see §5)*
- **Data display:** table ✅ *(opened — no explicit status field on page)*, dynamic-table ✅ *(opened — GA)*, table-tree, avatar, avatar-group, badge, lozenge, tag, tag-group, code, comment, calendar, date-label, image, empty-state, skeleton, progress-bar, progress-indicator, progress-tracker
- **Overlays & feedback:** modal-dialog ✅ *(opened — GA)*, drawer ✅ *(opened — **intent-to-deprecate**)*, popup, popper, inline-dialog, inline-message, flag, banner, section-message, spotlight, tooltip, blanket, portal
- **Navigation:** navigation-system ✅ *(opened — GA; the current/recommended nav system)*, side-navigation ✅ *(opened — **deprecated**, explicitly says "consider migrating to the new navigation system"), atlassian-navigation, breadcrumbs, menu, dropdown-menu, tabs, pagination, page, page-header, page-layout
- **Layout primitives:** primitives/ (anchor, bleed, box, flex, grid, inline, pressable, stack, text, focusable, metric-text, responsive, xcss)
- **Content/misc:** heading, link, logo, object, panel, tile, icon, css, css-reset, focus-ring, motion, onboarding, spinner, visually-hidden
- **Tooling:** tokens (+ all-tokens), eslint-plugin-design-system (+ use-primitives), eslint-plugin-ui-styling-standard, stylelint-design-system, storybook-addon-design-system, pragmatic-drag-and-drop
- **Rovo UI (AI-specific guidance layer):** about, button, color, elevation, generative-border, icon, illustration, motion, skills-tag, voice-and-tone — a distinct guidance set for AI/agent-surfaced UI, **relevant to Module 25 (AI-Assisted Capabilities)**.

**Open question:** which of the ~90 components carry a `deprecated` or `intent-to-deprecate` status was only checked for the two (`drawer`, `side-navigation`) opened during this audit. **Action item before UI build starts:** run a status sweep across all component files and produce an "approved for use / avoid / needs review" list — do not assume GA by default.

---

## 4. Foundations: typography, spacing, colour, layout, motion

**Confirmed**, sourced from real `@atlaskit/tokens` artifacts:

- **Design tokens** are the single source of truth for colour, elevation, spacing, typography, opacity, motion — name/value pairs like `color.icon.success`, consumed via a `token()` function in code (`token('space.200')`, `token('color.background.accent.magenta.subtlest')`) rather than hardcoded values. **Rule for the HRMS build: never hardcode a colour, spacing, or shadow value — always resolve through `token(...)`.**
- **Themes:** light and dark are first-class; a theme is defined as "a curated collection of token values." High-contrast is mentioned as a theme type but not confirmed as shipped.
- **Colour:** 466 semantic colour tokens, each with light + dark hex values, grouped by usage (background, text, border, icon, elevation/shadow, opacity, charts, skeleton loaders).
- **Spacing:** a token-based spacing scale (`space.050`, `space.100`, `space.200`, `space.300`, `space.400`, etc. observed in code examples) — the full scale is in `foundations/spacing.md` (not deep-read in this pass; treat exact step values as **unverified** until that file is read).
- **Typography:** font family/size/weight/line-height per named text style, sourced from token artifacts (not deep-read this pass).
- **Grid (`foundations/grid.md`, confirmed in full):**
  - 12-column grid in a `xxs`–`xl` responsive scheme (see §9 for exact breakpoints).
  - **Fixed-wide** (1296px max) — default for dashboards/directories. **Fixed-narrow** (864px max) — for long-form reading. **Fluid** — no max width, for horizontally-expanding content like kanban boards.
  - Rule: large containers (cards, tables, forms) align to grid columns; small elements (buttons, icons) use space tokens instead; overlays (modals, tooltips) sit outside the grid.
  - **Directly relevant to Phase 8 (IA):** the HRMS's list/dashboard pages should default to **fixed-wide**, not fluid, per this guidance — fluid is explicitly scoped to kanban-style horizontally-expanding UI, which is atypical for HR record-keeping screens.
- **Elevation, shape/radius, motion, border, iconography, illustrations, logos, content/voice-tone:** directories exist (`foundations/elevation.md`, `shape-radius.md`, `motion.md`, `border.md`, `iconography.md`, etc.) but were **not deep-read in this pass** — flagged as open follow-up before visual/interaction spec work begins.

---

## 5. Forms, validation, and state management

**Confirmed**, from `components/form.md`:

- Package: `@atlaskit/form` (`Form`, `Field`, `Fieldset`, `FormHeader`, `FormSection`, `FormFooter`, `CheckboxField`, `RangeField`, `CharacterCounterField`, `RequiredAsterisk`, message components `ErrorMessage`/`HelperMessage`/`ValidMessage`/`MessageWrapper`).
- **Validation is built into the form package itself** — no external schema library (Zod, Yup, react-hook-form, Formik) appears anywhere in the corpus. Validation is done via a `validate` prop on `Field` (function receiving current value, returning an error string or `undefined`), which supports **synchronous or Promise-returning (async) validation**, plus a `meta.validating` flag for in-flight async checks.
- **Submission-level validation**: `onSubmit` handler can return an error object (`{fieldName: 'error message'}`) synchronously or as a resolved Promise; returning `undefined` means success.
- Field-level state exposed via render props (`fieldProps`, `error`, `valid`, `meta.dirty`, `meta.validating`).
- Form-wide state subscription via `useFormState` hook — explicitly documented as **for UI/preview purposes only** ("Don't use these values for any permanent storage or state — rely on form submission for final values"), and demonstrated for **progressive-disclosure / conditional-field** patterns.
- Explicit guidance: **never disable the submit button** — use validation + inline messaging instead. This is a hard accessibility rule from the corpus and should become a binding UI rule for every HRMS form (leave requests, payroll input forms, onboarding forms, etc.).
- Required fields: marked with an asterisk + a visible legend ("Required fields are marked with an asterisk *") in the form header — a recurring, mandatory pattern across every example.
- Two form placement patterns are explicitly documented: **modal forms** (submit button aligned right, primary right-of-secondary) vs **single-page forms** (submit button aligned left, primary left-of-secondary). This is a concrete, must-follow convention for every "create/edit" flow in the HRMS (e.g., "Add employee" in a modal vs. a full-page onboarding form).
- **No app-level state management library is referenced anywhere** (no Redux/MobX/Zustand/Jotai/React Query/SWR). This is a genuine gap the HRMS architecture must fill — see Open Questions.

---

## 6. Table components

**Confirmed** — two distinct, non-interchangeable primitives exist:

1. **`@atlaskit/table`** — a low-level, composable, purely presentational primitive (`Table`, `THead`, `TBody`, `Row`, `Cell`, `HeadCell`, plus `ExpandableRow`/`ExpandableCell`/`ExpandableRowContent` for expandable rows). No built-in sorting, pagination, or state — the consumer wires that up.
2. **`@atlaskit/dynamic-table`** (GA) — a higher-level, stateful/statable table with built-in **sorting** (`isSortable`, `onSort`, `sortKey`/`sortOrder`), **pagination** (`rowsPerPage`, `page`, `onSetPage`), **loading state** (rows rendered at 20% opacity via the `opacity.loading` token, plus a spinner), **empty state** (`emptyView` prop), **drag-and-drop row ranking** (`isRankable`, `onRankStart`/`onRankEnd`), **row highlighting**, and both **controlled** (`DynamicTableStateless`) and **uncontrolled** (`DynamicTable`) variants.
- Explicit accessibility caution on **horizontal overflow/scrolling tables**: "can cause accessibility issues if there isn't enough visual affordance... we recommend finding ways to simplify the table before opting for a horizontal scroll solution." — directly relevant given the PRD's requirement to keep row-level actions minimal and avoid over-wide tables (many HRMS list views — employee directory, payroll register, attendance — are naturally wide).
- Explicit focus-management rule on row deletion: focus must move to the next focusable element, not fall back to `<body>` — a concrete a11y requirement for every "delete row" / bulk-action flow.
- **No built-in row-selection/bulk-action or column-configuration pattern was found** in either table component's documented API (no checkbox-select-all, no column picker). **This means bulk-action UI (bulk approve leave, bulk assign assets, etc.) and column customisation are patterns the HRMS must design and build on top of these primitives — they are not out-of-the-box Atlaskit behaviour.** This is a material input to every module's "Bulk-action requirements" section in Phase 6.

---

## 7. Modal, Drawer, and detail-page patterns

**Confirmed:**

- **Modal (`@atlaskit/modal-dialog`, GA):** header (h1 title) + close button + body + footer (primary right of secondary/cancel); dismissible via close button, `Esc`, blanket click, or footer Cancel. Appearances: default, **warning**, **danger** (each with matching button appearance). Widths: small/medium/large/x-large, plus a **`FullScreenModalDialog`** variant. Configurable scroll behaviour (scroll inside body vs. inside viewport). Strict focus-order rules (close → first focusable → secondary → primary → return focus to trigger on close), including a documented pattern for **focus restoration when the triggering element itself is deleted** (e.g., confirming deletion of a table row) — directly relevant to every "delete confirmation" flow in the HRMS (delete employee record, cancel leave, revoke asset, etc.).
  - Explicit usage rule: **modals are for one task, used sparingly, never nested** ("no nested modals — inaccessible"). This directly supports the PRD's own instruction to prefer detail pages over stacking dialogs for complex actions.
  - Explicit guidance: use Modal for "immediate task or critical/warning requiring a response"; use **Popup** for smaller info+controls, **Spotlight** for onboarding, **Inline message** for alert/action — i.e., the corpus already prescribes *which* overlay to use for which job, which the HRMS UI spec should inherit rather than re-litigate.

- **Drawer (`@atlaskit/drawer`) — status: `intent-to-deprecate`.** This is a material finding: **the HRMS should not adopt Drawer as a primary pattern for new screens.** Its usage guidance even says "consider alternative patterns like Modal for better UX." Where a slide-in side panel is genuinely needed (e.g., a lightweight "quick view" of an employee or a notification/approval side-panel), this should be flagged as an **open design decision** — either use Modal, or use a custom panel built from primitives (Box/Flex + `navigation-system` layout slots), not the deprecated Drawer component.

- **Detail-page pattern: does not exist in Atlaskit.** Atlaskit is a component/primitive library, not a page-template system — there is no shipped "record detail page" template. The PRD's own instruction ("use detail pages for complex records instead of packing actions into tables") is therefore a **product-level information-architecture decision for this HRMS**, to be composed from primitives (`page`, `page-header`, `page-layout`, `tabs`, `panel`, `breadcrumbs`) rather than inherited from the design system. This is explicitly deferred to **Phase 8 (Information Architecture)**.

---

## 8. Accessibility standards

**Confirmed**, from `foundations/accessibility.md`:

- A documented set of principles: consistent experiences via design-system components; simple language (target reading level **ages 12–14**); inclusive language; user control (reflow, scale/contrast adjustment, respecting `prefers-reduced-motion`); text alternatives (labels, alt text, transcripts); colour never used alone, with minimum contrast **4.5:1 for regular text, 3:1 for large text/graphics**; semantic HTML (`header`/`nav`/`footer` over generic `div`/`span`); and a directive to test with actual people with disabilities.
- Disability-category-specific guidance is documented (visual, auditory, mobility, cognitive), each with concrete UI implications (large touch targets, captions/transcripts, plain language with headings/short paragraphs, etc.) — directly usable as acceptance-criteria source material for every module's accessibility requirements.
- **No explicit WCAG conformance level (e.g. "2.2 AA") is stated anywhere in the corpus.** The PRD's own suggestion of targeting **WCAG 2.2 AA** (Phase 12) should be treated as this project's own commitment, not an inherited Atlaskit guarantee — Atlaskit provides accessible *components*, but end-to-end conformance is explicitly called out as the *building* team's responsibility ("developers must still ensure end-to-end accessibility").

---

## 9. Responsive breakpoints

**Confirmed**, from `foundations/grid.md`:

| Breakpoint | Viewport | Columns | Gutters | Margins |
|---|---|---|---|---|
| xxs | 320–479px | 2 | 12px | 16px |
| xs | 480–767px | 6 | 12px | 16px |
| s | 768–1023px | 6 | 12px | 16px |
| m | 1024–1439px | 12 | 16px | 32px |
| l | 1440–1767px | 12 | 16px | 32px |
| xl | 1768px+ | 12 | 16px | 32px |

This is the binding breakpoint system for all HRMS responsive layout work (Phase 8, Phase 24 mobile scope). Note the design guidance itself: "designers should create layouts for at least two screen sizes, ideally including mobile" — implying Atlaskit's own layout system treats mobile web as a first-class but not the only target; a genuinely mobile-optimized experience (per Phase 24) will still require its own interaction design on top of this grid, especially for high-frequency actions like check-in/check-out.

---

## 10. Technical limitations, inconsistencies, and risks to carry forward

1. **No backend/data-layer opinion exists in the design system.** Every backend, database, auth, API, and state-management decision for the HRMS is green-field. This is the single biggest scoping implication of this audit: Phases 9, 10, 11 of the PRD are not "document what's there," they are the **actual architecture decisions**, and should be treated with commensurate rigor and stakeholder sign-off.
2. **Component maturity is mixed and must be checked per-component, not assumed.** Two components inspected directly in this audit are already deprecated or on their way out (`side-navigation`: deprecated; `drawer`: intent-to-deprecate), in favour of `navigation-system` and (for overlays) `modal-dialog`/custom panels respectively. A full status sweep of all ~90 components (§3) is a prerequisite before the HRMS UI spec locks in specific components module-by-module.
3. **No bulk-action or row-selection primitive.** Both table components are either purely presentational or add only sort/paginate/rank — multi-select + bulk action (central to Payroll input review, Leave approval inboxes, Recruitment pipeline actions, etc.) must be designed by the HRMS team on top of these primitives, consistent with the PRD's rule to keep row-level actions minimal and push complex actions to detail pages.
4. **No detail-page, list-page, or dashboard template exists.** These are pure product decisions for Phase 8, built from lower-level primitives (`page`, `page-header`, `page-layout`, `panel`, `tabs`, `breadcrumbs`).
5. **Internal vs. public design-system surface is ambiguous.** Some referenced resources are explicitly "Atlassians only" (internal Figma libraries, internal a11y tooling, internal wiki links). This suggests the mirrored site may include content intended for Atlassian-internal consumers, which raises an **open question about whether taking a direct dependency on the public `@atlaskit/*` npm packages is the intended integration path**, versus some other internal distribution the user already has access to. This should be confirmed with the user/stakeholders before implementation begins (out of scope for this PRD phase, but a blocking question before Phase 8 visual/component mapping work).
6. **Depth of this audit is intentionally partial.** Only a targeted subset of the 165 files was opened (grid, accessibility, tokens overview, form, table, dynamic-table, modal-dialog, drawer, navigation-system, side-navigation). Typography/spacing exact scale values, elevation, motion, iconography, and most of the ~80 remaining component files were **not** individually reviewed. None of the conclusions above depend on those unreviewed files, but implementation-level specs (Phase 8 onward) should re-open the specific component file for any component being used, rather than relying solely on this summary.

---

## 11. Assumptions carried forward from this audit

- **A1:** The HRMS will be a new React application (matching the design system's framework) — not React Native, not a different framework, for the web/desktop experience. *(Confirms with "use the existing design system consistently.")*
- **A2:** Mobile (Phase 24) will be a **separate delivery** (native or responsive web) rather than assuming Atlaskit's React web components run unmodified on a native mobile runtime — Atlaskit is a web/React component library, not a React Native library. **This needs explicit stakeholder confirmation** (see Open Questions, Phase 24).
- **A3:** Backend framework, database engine, auth provider, API style, and state-management library are **fully open decisions** for the SaaS Architect track of this PRD (Phases 9–11), constrained only by: multi-tenant SaaS, India-first payroll/statutory compliance, and enterprise-scale data volumes (thousands of employees, effective-dated records, audit trails).

## 12. Open questions raised by this audit (carried to master Open Questions list)

- OQ-1: Is direct use of the public `@atlaskit/*` npm packages the intended integration path, or is there an internal/licensed distribution channel?
- OQ-2: What is the intended mobile delivery model — native app, responsive web reusing Atlaskit, or a separate mobile design system?
- OQ-3: Which of the ~90 Atlaskit components are approved-for-use vs. deprecated/avoid, beyond the two checked here? (Action: full status sweep before Phase 8 component mapping.)
- OQ-4: Does the organisation have an existing backend/infra standard (cloud provider, DB engine, auth provider) from other products that this HRMS should align with, even though none exists in this specific workspace?
