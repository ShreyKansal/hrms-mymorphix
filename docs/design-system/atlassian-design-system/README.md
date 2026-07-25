# Atlaskit archive

The app's component layer has fully moved to Radix + Tailwind (see `docs/design-system/
supabase/`). These two files are what's left of the Atlaskit-based implementation — kept here,
not deleted, per explicit instruction: they may be useful reference later.

- **`SelectField.tsx`** — the native-`<select>`-styled-to-match-`@atlaskit/textfield` adapter
  used throughout the app before the migration (see its own header comment for the two real
  Atlaskit bugs it worked around: DOM-attribute leakage from spreading `fieldProps` directly,
  and a `display` cascade bug). Superseded by `apps/web/src/components/ui/select.tsx`.
- **`detailStyles.ts`** — the shared `labelStyle`/`valueStyle`/`rowStyle`/`cellStyle` constants
  used for the field-label/value and small-embedded-table pattern across the old Atlaskit
  screens. Superseded by plain Tailwind utility classes inline in each migrated component.

**What actually carried forward, not archived here:** Atlaskit's real, measured colors and font
stack — those live in `apps/web/src/styles/tailwind.css` as the new Tailwind theme's actual
values (see that file's own header comment for how they were measured), which is the whole
point of the migration: keep Atlaskit's visual identity, replace the component/styling layer
underneath it.

The `@atlaskit/*` npm packages themselves are no longer a dependency of `apps/web` — nothing in
the active app imports them anymore. If a future session needs to see how a specific Atlaskit
component actually behaved, `npm view @atlaskit/<package>` or the package's own docs are the
place to look; this folder is just the two adapter files this app itself had written around
them, not a copy of Atlaskit's own source.
