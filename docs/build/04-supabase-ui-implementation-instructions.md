# Supabase-aligned UI implementation instructions

Use this checklist when creating or reviewing any HRMS screen. The detailed rationale and
pattern decisions live in [`03-ui-patterns.md`](03-ui-patterns.md).

## Non-negotiable architecture

1. Use local components from `apps/web/src/components/ui/`.
2. Use Radix primitives for interactive behaviour that needs focus management, keyboard
   navigation, portals, overlays, or compound-component state.
3. Use Tailwind utilities for layout and visuals.
4. Use `cva` for reusable variants and `cn()` for class merging.
5. Use semantic theme tokens from `apps/web/src/styles/tailwind.css`.
6. Do not install or import `@atlaskit/*`.
7. Do not copy Supabase brand colors/fonts. This HRMS keeps its configured theme while
   following Supabase's component architecture and patterns.

## Before coding a screen

- Identify the screen as a list, record detail, settings form, dashboard, or focused workflow.
- Choose container width: 480px focused, 864px default, 1296px dense.
- List loading, empty, error, restricted, and success states.
- Decide whether the task belongs inline, in a dialog, in a sheet, or on a full page.
- Check the extracted Supabase reference:
  `docs/design-system/supabase-design-system/README.md`.
- Reuse an existing atom or fragment before creating a new one.

## Page skeleton

```tsx
export function ExamplePage() {
  return (
    <div className="mx-auto max-w-[864px] p-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Page title</h1>
          <p className="mt-1 text-sm text-text-subtle">Useful context, not repeated copy.</p>
        </div>
        <Button variant="primary">Primary action</Button>
      </header>

      <section aria-labelledby="section-title">
        <Card>
          <CardHeader>
            <CardTitle id="section-title">Section title</CardTitle>
          </CardHeader>
          <CardContent>{/* content */}</CardContent>
        </Card>
      </section>
    </div>
  )
}
```

If the screen has a filter bar, move the action there instead of duplicating it in the header.
Breadcrumbs remain in `AppShell`.

## Forms

- Use shared `Label`, `Input`, and `Select`.
- Give every control a stable `id`.
- Connect errors with `aria-describedby`; set `aria-invalid`.
- Preserve user input when validation or a request fails.
- Use a capped two-column grid for short page-form fields and a single column on small screens.
- Put actions in the page action row, `CardFooter`, or `DialogFooter`.
- Disable unchanged Save actions.
- Set the submitting button to `loading`; prevent duplicate requests.
- Focus the first invalid field after failed validation.

Never use placeholder-only labels, feature-local native-control styling, or raw database error
messages.

## Tables

- Use shared `Table` primitives.
- Use `Table` alone for small/static content.
- Compose sorting, filters, pagination, selection, and row actions only when needed.
- Use semantic headers and real controlled sort state.
- Give every selected-row checkbox a real bulk action.
- Distinguish empty collection from zero filter results.
- Keep loading/error rows structurally aligned with the final table.
- Add a data-grid dependency only for virtualisation, column resize, or cell editing.

## Dialogs and sheets

- Use `Dialog` for a short, single-purpose interruption.
- Use an alert/confirmation variant for decisions.
- Require typed confirmation for genuinely high-risk irreversible actions.
- Use a sheet for a larger complementary panel.
- Use a full page for multi-category or multi-step work.
- Always include title, optional description, explicit primary/cancel labels, focus
  restoration, Escape support, and dirty-form handling.

Do not stack dialogs or place an entire settings page inside a modal.

## Actions

- One primary action per region.
- Label actions with a specific verb and object.
- Use `destructive` only for destructive operations.
- Icon-only controls require `aria-label`.
- Disabled controls explain why when the reason is not obvious.
- Hiding a control never replaces server-side authorisation.

## States

Every remote-data component implements:

```text
initial/loading -> success with data
                -> success with no data
                -> filtered with no matches
                -> permission-restricted
                -> recoverable error
```

Use skeletons for predictable loading layouts, action-oriented copy for first-use empty states,
Clear filters for zero results, and Retry only where retry can succeed.

## Styling

- Use semantic classes, never module-level hex values.
- Use `rounded-md`/`rounded-lg`; do not reintroduce the old 3px Atlaskit radius.
- Use `text-foreground`, `text-text-subtle`, and `text-text-subtlest` intentionally.
- Keep normal spacing on a 4/8px rhythm.
- Use `gap` and container padding instead of scattered child margins where possible.
- Use class variants in the shared component rather than repeating long class strings across
  screens.
- Do not combine inline style objects and Tailwind for the same concern.

## Accessibility review

- Complete keyboard flow without a mouse.
- Confirm visible focus on every interactive element.
- Confirm heading order and semantic landmarks.
- Confirm input labels, descriptions, and errors.
- Confirm dialog focus trap, close behaviour, and focus restoration.
- Confirm icon-only labels and table header associations.
- Confirm meaning is not color-only.
- Confirm layout at narrow viewport and 200% zoom.

## Creating a shared component

Create a new shared atom/fragment only when at least one is true:

- the composition is already repeated;
- it owns non-trivial interaction/accessibility behaviour;
- centralising it prevents visual or state drift.

The component must:

- accept `className` where composition needs it;
- forward relevant refs/HTML props;
- expose a small intentional variant API;
- use semantic tokens;
- include disabled, focus, and error states where relevant;
- avoid HRMS-module-specific data fetching or business rules.

Update `03-ui-patterns.md` when the component establishes a new product-wide pattern.

## Definition of done

- Shared primitives used; no Atlaskit import.
- Correct page/container pattern.
- Loading, empty, error, restricted, and success states implemented.
- Keyboard and responsive checks passed.
- No raw brand/color values in the feature.
- Authorisation enforced beyond UI visibility.
- New shared pattern documented.
