# Supabase Design System — research index

Scraped from [supabase.com/design-system](https://supabase.com/design-system) on 2026-07-25
(rendered live-site HTML; GitHub source was not used) to ground this app's Supabase Studio-style
UI in the design system's actual, real markup/classes rather than guesswork.

## Coverage

| Section | Pages | Extracted code blocks |
| --- | ---: | ---: |
| Overview | 1 | 0 |
| Getting Started | 8 | 23 |
| Ui Patterns | 10 | 35 |
| Fragments | 26 | 89 |
| Components | 58 | 325 |
| **Total** | **103** | **472** |

The full scrape (per-page Markdown, extracted code snippets, and raw HTML for audit — ~34MB
across 683 files) is **not** committed to this repo; it was a one-time research input, not
product content, and doesn't belong in permanent git history. `MANIFEST.csv` and
`SIDEBAR-ROUTES.txt` in this folder are the lightweight index of what was covered. The findings
themselves are what matter and those live in `docs/build/03-ui-patterns.md` and
`docs/build/04-supabase-ui-implementation-instructions.md`, plus the actual component
implementations in `apps/web/src/components/ui/`.

If a future session needs to re-derive something from the original scrape, re-run it against
the live site (see `SIDEBAR-ROUTES.txt` for the page list) rather than expecting it to be here.
