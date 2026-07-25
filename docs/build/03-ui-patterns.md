# UI Patterns — Supabase-aligned product rules

**Status:** canonical UI-pattern guide for this HRMS.

**Design-system source:** the live Supabase Design System crawl stored at
[`../design-system/supabase-design-system/`](../design-system/supabase-design-system/README.md).
The crawl contains the homepage plus all 102 sidebar pages, their rendered code blocks, and raw
HTML snapshots. This guide adapts those public patterns to this product; it does not require
Supabase's brand identity.

## 1. The rule that resolves most ambiguity

Use Supabase's **component architecture and composition rules**:

- React components built from Radix primitives;
- Tailwind utilities backed by semantic CSS variables;
- `class-variance-authority` for explicit component variants;
- `cn()` for predictable class composition;
- copy/local ownership of components instead of depending on a remote design-system package;
- accessible HTML, keyboard behaviour, focus states, labels, descriptions, and errors.

Keep this HRMS's explicitly chosen **color tokens and font stack**. They are defined in
`apps/web/src/styles/tailwind.css` and currently retain the measured Atlassian-derived palette
and typography. Do not copy Supabase green, Supabase fonts, or Supabase product wording into
the HRMS merely because a reference example uses them.

Supabase determines structure, shape, states, interaction, and composition. The HRMS theme
determines brand color and typography.

## 2. Component hierarchy

Supabase divides UI into three levels. Use the same distinction:

1. **Atom components** are the smallest reusable building blocks: `Button`, `Input`, `Label`,
   `Select`, `Badge`, `Card`, `Dialog`, `Table`, and `Tabs`. They live in
   `apps/web/src/components/ui/`.
2. **Fragment components** combine atoms into a repeatable product element: page header,
   confirmation dialog, filter bar, form-item layout, empty state, metric card, and page
   section. Put a fragment in `apps/web/src/components/` or `apps/web/src/lib/` only after the
   composition appears more than once or has behaviour worth centralising.
3. **UI patterns** describe how atoms and fragments form a complete screen: settings form,
   searchable table, record detail, dashboard, navigation, or destructive flow.

Do not turn every one-off wrapper into a shared component. Do not reimplement an atom locally
inside a feature when the shared primitive already exists.

## 3. Page layout

The canonical screen order is:

1. `AppShell` breadcrumb row;
2. optional sub-navigation;
3. page header when a title/description adds context;
4. page container;
5. one or more page sections.

The breadcrumb belongs to the shell, not inside an individual page header. A sub-navigation
row is its sibling, not its child. Parent routes with sub-navigation may omit a page header;
child routes provide their own title and context.

### Container widths

Use width according to content, not according to the module:

| Size | Current HRMS width | Use |
| --- | ---: | --- |
| Small/focused | `max-w-[480px]` | Authentication, compact forms, narrow configuration. |
| Default | `max-w-[864px]` | Record details, settings, multi-section forms, team and organisation pages. |
| Full/dense | `max-w-[1296px]` | Data-heavy tables, charts, logs, wide editors. |

Use `mx-auto p-6` for the normal page container. A route may use different widths across its
children. Dense content does not justify making every settings page full width.

### Page-header actions

- Put primary page actions beside the header only when no filter/toolbar exists.
- For list screens with a filter row, put actions on the right side of that row.
- For compact data surfaces, actions may sit in the breadcrumb row or an in-page toolbar.
- Use section-level actions beside the relevant section, not at page level.

## 4. Navigation

`AppShell.tsx` owns persistent navigation and route breadcrumbs.

- Sidebar items represent top-level destinations and change the URL.
- Active, hover, focus, and disabled states must be visible.
- Use Lucide icons consistently; do not mix icon libraries within the shell.
- A top-level page does not need an extra in-body back link.
- Detail routes use the breadcrumb trail for hierarchy. Dynamic labels come from
  `usePageTitleStore`; do not perform a duplicate fetch in the shell.
- Browser titles should move from specific to general:
  `Entity | Section | HRMS`.

The sidebar search control is a trigger for the centred command palette, not a miniature live
search surface. The palette must support `Cmd/Ctrl+K`, arrow keys, Enter, Escape, meaningful
idle content, zero-results content, and a labelled dialog.

Hiding navigation is only UX. Authorisation still belongs in database policies, RPC checks,
and protected route/data logic.

## 5. Forms

Forms should use shared `Label`, `Input`, `Select`, `Button`, and validation/error treatments.
Do not hand-style native controls in feature modules.

### Field structure

Every field has:

1. a visible label associated through `htmlFor`/`id`;
2. a shared control;
3. optional description/help text;
4. an error message connected to the control;
5. `aria-invalid` when invalid.

Required state must be communicated visually and semantically. Placeholder text is not a
label. Disabled fields must remain legible and must not look interactive.

### Form layout

- Use a vertical layout for compact sheets/dialogs and narrow screens.
- For page forms, use a capped two-column grid for naturally short fields:
  `grid max-w-[640px] grid-cols-2 gap-x-6 gap-y-3`.
- Give genuinely long inputs a full row.
- Group related fields in a `Card`/section; do not present a long undifferentiated stack.
- Keep Save/Cancel actions in `CardFooter`, `DialogFooter`, or the page's final action row.
- Disable Save when there are no changes.
- Show loading on the submit button during an asynchronous submission.
- Prevent double submission.

### Inline form, dialog, sheet, or page

| Surface | Use it when |
| --- | --- |
| Inline form | Adding/editing a few fields in the context of a list already on screen. |
| Dialog | Short, focused, single-purpose task that needs interruption and confirmation. |
| Sheet | A larger complementary editor/settings panel where the underlying screen remains useful context. |
| Full page | Long, multi-category, infrequent, or multi-step work. |

`CreateEmployee.tsx` correctly uses a full-page stepper because the flow spans personal,
contact, assignment, education, employment, and review categories. `TransferEmployeeModal.tsx`
may remain a dialog because it is a single assignment-change task and most fields start with
current values.

## 6. Modality and confirmations

Choose the smallest suitable modal pattern:

| Pattern | Use |
| --- | --- |
| Alert dialog | Short critical confirmation with one concise message. |
| Confirmation dialog | Confirmation needing supporting context or a small control. |
| Text-confirm dialog | High-risk irreversible action requiring typed confirmation. |
| Dialog | Bespoke short flow. |
| Sheet | Larger multi-field or detailed complementary task. |

Rules:

- Dialog title and primary action must describe the same operation.
- Destructive actions use the destructive variant and explicit object/action language.
- Keep content focused on the decision.
- `Escape`, close button, and backdrop dismissal should work unless an accessibility-reviewed
  constraint requires otherwise.
- If a form is dirty, intercept dismissal and ask whether to discard changes. Clean forms
  close immediately.
- Never stack complex dialogs. Move the flow to a page or sheet.
- Restore focus to the trigger after close.

## 7. Tables and data grids

Use one of Supabase's three table tiers:

| Tier | Use |
| --- | --- |
| `Table` | Simple, static or small read-only data without complex controls. |
| Data table | Sorting, filtering, pagination, column visibility, selection, or row actions. Compose the current shared `Table` with state/behaviour. |
| Data grid | Virtualisation, resizable columns, spreadsheet-like editing, or very large datasets. Add only when a real module needs these capabilities. |

The shared `Table` primitive is the only visual table base. Do not import Atlaskit DynamicTable
or create feature-specific table CSS.

For data tables:

- use semantic `table`, `thead`, `tbody`, `th`, and `td`;
- give columns widths based on content;
- numeric columns align right;
- sortable headers expose the current direction and actually toggle;
- filter and pagination state must be controlled;
- selection checkboxes require a real bulk action;
- row actions use clear labels and keyboard-accessible menus;
- loading, no-data, no-results, error, and disabled states are distinct;
- filters returning zero rows say that no results matched and offer a reset;
- page controls disable correctly at the first/last page.

Do not add virtualisation or a data-grid dependency to a small embedded table.

## 8. Empty, loading, error, and restricted states

Every data surface must design all four states before it is complete.

### Empty

- First-use/presentational empty states use an icon, action-oriented title, short explanation,
  and one primary CTA.
- Table empty states preserve the table structure to avoid layout shift.
- Filtered zero-results states say that the current query matched nothing and offer Clear
  filters/Search.
- Do not say “Create…” when the viewer lacks permission to create.

### Loading

- Use skeletons where the final layout is predictable.
- Use button-level loading for mutations.
- Avoid replacing an entire stable page with a spinner for a small refresh.

### Error

- Explain what failed in plain language.
- Preserve entered form data.
- Offer retry when retry is meaningful.
- Do not expose database/internal error details to end users.

### Restricted

Hidden controls are not security. The server/database remains authoritative. When a user can
see a surface but cannot mutate it, show a readable disabled/restricted state instead of a
control that fails after interaction.

## 9. Cards and sections

- `Card` groups related content, not every arbitrary block.
- `CardHeader` contains section title/description.
- `CardContent` contains the information or form fields.
- `CardFooter` contains actions directly affecting that card.
- Multiple page sections need headings; a single obvious section does not need a redundant
  heading.
- Keep border, radius, and shadow choices inside shared primitives.
- Do not combine local inline styles with Tailwind for the same visual rule.

## 10. Buttons and actions

Use the shared `Button` variants:

- `primary` for the strongest positive/create/confirm action;
- `default` for normal dialog and navigation actions;
- `secondary`/`outline` for lower-emphasis alternatives;
- `ghost` for chrome and compact tertiary actions;
- `destructive` for irreversible/destructive operations;
- `link` only when the action should visually read as a link.

These seven variants are the current `button.tsx` API. Supabase also documents a `warning`
variant for serious but non-destructive side effects; this HRMS has warning theme tokens but
does not yet expose that button variant. Add it centrally to `button.tsx` before using
`variant="warning"`—do not simulate it with feature-local classes.

One region normally has one primary action. Button text starts with a verb and names the
result: “Add employee”, “Save changes”, “Send invitation”. Do not use vague labels such as
“Submit” when the actual action can be named.

Icon-only buttons require an accessible label and tooltip where the action is not obvious.
Loading buttons stay disabled and preserve enough width to avoid layout shift.

## 11. Tabs, breadcrumbs, and page sections

- Tabs switch related views within one route context; sidebar links navigate between
  destinations.
- Tab triggers use Radix semantics and keyboard behaviour through the shared `Tabs` primitive.
- Do not use tabs as a multi-step form. Use `Stepper`.
- Breadcrumbs express hierarchy, not browser history.
- A page section groups one meaningful subject. Actions in a section affect that section.

## 12. Charts and metrics

Use charts only when visual comparison or trend detection is materially easier than a table.
Recharts is the approved chart engine.

- Wrap charts in a card/section with a title, metric/context, time range, and optional actions.
- Provide loading, empty, disabled/restricted, and error states.
- Use the semantic theme palette; never hardcode a random series palette inside a module.
- Do not rely on color alone to distinguish series.
- Preserve a table or textual summary where accessibility or exact-value reading requires it.
- Prefer supplied chart types before inventing another abstraction.

## 13. Markdown and rich content

Sanitise untrusted Markdown. Define explicit renderers for headings, paragraphs, links, lists,
code, tables, images, and callouts so imported Markdown cannot bypass the design system.
External links need clear behaviour. Code blocks must remain selectable and horizontally
scrollable.

## 14. Accessibility baseline

The following are release requirements:

- keyboard access for every interactive element;
- visible focus indication;
- semantic elements before ARIA;
- associated form labels and described errors;
- dialog title/description and correct focus trapping/restoration;
- sufficient contrast in every supported theme;
- screen-reader text for icon-only controls;
- no information conveyed by color alone;
- reduced-motion support for non-essential animation;
- table headers associated with data cells.

Radix supplies behaviour, not complete accessibility. The feature author still owns labels,
copy, focus order, state announcements, and validation.

## 15. Spacing, color, type, and responsive behaviour

- Use Tailwind's spacing scale; prefer 4/8px rhythm.
- Use semantic classes such as `bg-background`, `text-foreground`, `border-border`,
  `text-text-subtle`, and `bg-primary`.
- Never place raw hex values in feature components. Add or reuse a semantic token.
- Keep the font stack in `tailwind.css`.
- Use Tailwind's default radius scale (`rounded-md`, `rounded-lg`) as the Supabase-aligned
  shape language.
- Two-column forms collapse to one column on narrow screens.
- Tables need an overflow strategy rather than shrinking text until it becomes unreadable.
- Dialog/sheet sizes must leave usable viewport margins on mobile.

## 16. Current shared sources of truth

| Concern | Source |
| --- | --- |
| Theme tokens and typography | `apps/web/src/styles/tailwind.css` |
| Atom components | `apps/web/src/components/ui/` |
| Class merging | `apps/web/src/lib/ui/cn.ts` |
| Shell/navigation/breadcrumbs | `apps/web/src/lib/AppShell.tsx` |
| Command palette | `apps/web/src/lib/CommandPalette.tsx` |
| Multi-step flows | `apps/web/src/lib/Stepper.tsx` |
| Avatar helpers | `apps/web/src/lib/avatar.ts` |
| Full Supabase reference crawl | `docs/design-system/supabase-design-system/` |
| Coding checklist | `docs/build/04-supabase-ui-implementation-instructions.md` |

When a new reusable pattern is introduced, document it here in the same change.
