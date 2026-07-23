# 07 — Information Architecture

**Status:** Draft v1 (pending stakeholder review)
**Last updated:** 2026-07-23
**Depends on:** [00-existing-system-audit.md](00-existing-system-audit.md) (the design-system constraints this IA is built within), all 25 module PRDs
**Scope note:** hierarchy and navigation only, per the brief's own instruction — no visual screen design in this phase.

---

## 1. Design-system constraints this IA must work within

Restating the load-bearing findings from [00-existing-system-audit.md](00-existing-system-audit.md) so this document is self-contained: a 12-column, 6-breakpoint responsive grid with **fixed-wide (1296px)** as the default for dashboards/directories (§4 of that document) — this product's list/dashboard pages should default to fixed-wide, not fluid; **`navigation-system`** (GA) is the current top-nav/layout system, **`side-navigation`` is deprecated** in favour of it; **`drawer` is intent-to-deprecate**, so slide-in panels in this IA use Modal or custom primitive-built panels, never Drawer; there is **no shipped detail-page or list-page template** in Atlaskit — the structures below are this product's own information-architecture decisions, composed from primitives (`page`, `page-header`, `page-layout`, `panel`, `tabs`, `breadcrumbs`), not inherited from the design system.

## 2. Primary navigation sections

Per the brief's explicit list, with the module(s) each section surfaces:

| Section | Primary modules | Primary personas |
|---|---|---|
| Home | Module 16 (Employee/Manager Home) | Everyone |
| People | Module 1, Module 3 (onboarding status) | HR, Managers |
| Organisation | Module 2 | HR Administrator, System Administrator |
| Recruitment | Module 8 | Recruiter, Hiring Managers |
| Attendance | Module 4 | Everyone (self), HR (org-wide) |
| Leave | Module 5 | Everyone (self), HR (org-wide) |
| Payroll | Module 6, Module 7 | Payroll Executive/Administrator, Finance |
| Expenses | Module 7 (own view for Employee, distinct from Payroll's processing view) | Everyone (self), Finance |
| Performance | Module 9 | Everyone, Managers |
| Learning | Module 10 | Everyone |
| Engagement | Module 11 | Everyone |
| Helpdesk | Module 12 | Everyone, HR |
| Documents | Module 13 | Everyone (own), HR (repository management) |
| Assets | Module 14 | Everyone (own), IT/HR |
| Reports | Module 19 | Role-scoped per [12-report-catalogue.md](12-report-catalogue.md) |
| Approvals | Module 16 §7.1 (aggregates Modules 4, 5, 6, 7, 8, 9, 15) | Managers, approvers of any kind |
| Administration | Module 21, Module 22, Module 23, Module 17, Module 20 | System/HR Administrator |

**Design rule (per the brief's own instruction):** not every persona sees every section — navigation itself is permission-filtered (Module 21), not just the content within a section. A Payroll Executive with no recruitment access should not see "Recruitment" in their nav at all, not see it and hit an access-denied page.

## 3. Global navigation structure

Built on `navigation-system`'s `TopNav` (per [00-existing-system-audit.md](00-existing-system-audit.md) §3/§7):

- **Top nav bar:** product logo/home, global search (§7), notification centre (Module 18), Approval Inbox quick-access (Module 16 §7.1 — given how central this is to the mobile-first personas, it deserves top-level visibility, not burial in a menu), Legal-Entity switcher (§9, permission-gated), user menu (profile, preferences, sign out).
- **Primary navigation (left rail or top-nav dropdown, per `navigation-system`'s layout patterns):** the sections in §2, permission-filtered, in the order listed (Home first, Administration last — roughly ascending from personal/frequent to administrative/infrequent, matching [04-personas-and-roles.md](04-personas-and-roles.md)'s frequency analysis).
- **Module-level navigation:** within a section (e.g., Payroll), a secondary nav or tab structure surfaces that module's own sub-areas (e.g., Payroll → Runs, Salary Structures, Statutory Reports, Tax Declarations) — this is module-specific and detailed in each module's own §15 "Record detail-page requirements," not re-derived here.

## 4. Page hierarchy pattern

Every section follows the same three-tier pattern, consistent across the whole product (a deliberate consistency choice, directly responding to [04-personas-and-roles.md](04-personas-and-roles.md)'s repeated finding that inconsistent patterns across modules is a source of user confusion):

1. **List page** (§5) — the section's primary landing page, e.g., Payroll → Runs list.
2. **Detail page** (§6) — a specific record, e.g., a single payroll run, opened from the list.
3. **Action surfaces** — Modal (for focused, single-task actions per [00-existing-system-audit.md](00-existing-system-audit.md) §7's usage rule) or an inline form section on the detail page itself for multi-step/complex actions, **never a nested modal-within-modal** (explicitly disallowed by Atlaskit's own accessibility guidance, §7 of the audit).

## 5. List-page structure

- Fixed-wide grid layout (§1).
- Table built on `@atlaskit/dynamic-table` for sortable/paginated lists, or `@atlaskit/table` for simpler presentational cases (per [00-existing-system-audit.md](00-existing-system-audit.md) §6's finding that neither has built-in bulk-select — this product's list pages implement a custom checkbox-select-all pattern on top of these primitives, consistently across every module, not reinvented per-module).
- **Row-level actions kept minimal** (per the brief's explicit UX principle) — typically one primary action (e.g., "View") with anything else pushed to the detail page, never a row cluttered with five icon buttons.
- Filters: for modules with a small, stable filter set (e.g., Module 5's leave-type filter), inline filter chips; for modules with many/dynamic filter options (e.g., Module 19's report builder), a collapsible filter panel — this scaling rule (per the brief's "keep filters scalable when many options exist" principle) is applied consistently, not module-by-module improvised.
- Saved views (Module 19-adjacent capability, available on any sufficiently complex list page — e.g., an HR Administrator's saved "at-risk onboarding" filter on Module 3's list).
- Server-side pagination/filtering mandatory at enterprise scale (Phase 12 NFR) — no client-side-only filtering on a list that could hold thousands of records.

## 6. Detail-page structure

Per the brief's central UX instruction — detail pages, not table-packed actions, for complex records:

- **Header:** record identity (name/ID/status badge), primary action(s) (permission-gated, e.g., "Edit," "Transfer" on an Employee detail page), breadcrumb back to the list page **preserving prior filter/scroll context** (explicitly required by the brief — navigating back from a detail page should not reset the list to its default state).
- **Body:** tabbed or sectioned (per `@atlaskit/tabs`/`panel`), following each module's own §15 specification — e.g., Module 1's Employee Detail page (Profile, Employment, Compensation, Documents, Assets, Performance, Timeline).
- **Avoid excessive nested tabs** (explicit brief principle) — this product's detail pages should go at most two levels deep (a top-level tab, optionally a sub-section within it), never a tab-within-a-tab-within-a-tab.
- **Timeline/audit view as a first-class tab**, not an afterthought, for every module with meaningful history (directly generalising Module 1 §15's Timeline tab pattern to every applicable module).
- **Progressive disclosure:** advanced/rarely-used fields and actions are one interaction deeper (an "Advanced" expandable section, or a secondary action behind a kebab menu) rather than surfacing everything at once — consistent with the brief's explicit principle.

## 7. Global search and command search

- **Global search:** typeahead across Employee directory (Module 1), Documents (Module 13), Helpdesk knowledge base (Module 12), and, permission-gated, other record types — a single search entry point in the top nav, not a per-module search box users have to remember to look for.
- **Command search** (a "quick action" palette, e.g., "apply for leave," "raise a ticket," triggered by a keyboard shortcut or a search-bar mode) — directly serves the high-frequency, low-friction actions Module 24 prioritises for mobile-equivalent speed on desktop too.

## 8. Notification centre and Approval Inbox

Both are top-nav-anchored, always-accessible, not buried within a specific section — per Module 18 (notifications) and Module 16 §7.1 (approvals)'s status as cross-cutting, high-frequency surfaces. The Approval Inbox specifically should never require navigating into the "Approvals" section to be discovered — a badge/count indicator in the top nav is the primary discovery path, consistent with the mobile-first design already specified in Module 16 §20.

## 9. Legal-entity and location switcher

For multi-entity tenants (per [05-organisation-data-model.md](05-organisation-data-model.md) §3), a Legal-Entity switcher in the top nav lets a user with cross-entity access (Module 21's explicit scope-grant concept, [05-organisation-data-model.md](05-organisation-data-model.md) §10) change their working context (e.g., an HR Administrator supporting two legal entities switching between them). **This switcher should be invisible/absent for single-entity tenants and for users without cross-entity scope** — not a permanently-present UI element that's simply disabled, per the progressive-disclosure principle applied to navigation itself, not just page content.

## 10. Employee switcher ("view as")

For roles permitted to act on another employee's behalf in a limited, audited way (an HR Administrator assisting an employee with a self-service task, or Module 21's impersonation-controls capability) — this should be a clearly-labelled, distinctly-styled mode (e.g., a persistent banner: "You are viewing as [Employee Name]") to prevent the confusion/error risk of an administrator forgetting which context they're in, directly implementing Module 21 §9's impersonation-controls requirement at the IA level.

## 11. Recent items and saved views

A "Recent" surface (recently-viewed employee records, recently-viewed reports) reduces re-navigation friction for HR/Payroll personas who repeatedly return to the same handful of records during a busy period (e.g., a Payroll Executive checking the same few flagged employees during payroll-close week) — a small but concrete usability investment directly informed by [04-personas-and-roles.md](04-personas-and-roles.md)'s persona-specific high-frequency-workflow analysis.

## 12. Mobile navigation

Per Module 24's deliberately-scoped mobile surface: mobile navigation is a **flattened, action-oriented** structure (a bottom tab bar or equivalent: Home, Approvals, Directory, Notifications, More) rather than a miniaturised version of the full desktop section list — most of the 16 sections in §2 are desktop-only in practice (Administration, Reports-builder, Organisation-configuration), so mobile navigation should not present them as if they were equally mobile-appropriate destinations.

## 13. Permission-based navigation

Restating §2's core rule as its own principle: every navigation element (top-level section, sub-navigation item, action button) is filtered by the viewing user's actual Module 21 permissions — this is a rendering behaviour, not a security control (per [00-existing-system-audit.md](00-existing-system-audit.md)'s explicit framing that frontend restrictions are UX only), so the backend must independently enforce the same boundary regardless of what the navigation shows or hides.

## 14. Empty states

Every list page must have a considered empty state (not a bare "no results" message) — per the brief's explicit requirement and reinforced across nearly every module's own §24: a new tenant's Employee directory should prompt "add your first employee," a manager's empty Approval Inbox should say something positive ("you're all caught up"), a new employee's document repository should explain what will appear there once available — consistent, deliberate empty-state content is a real (if easy to overlook) part of this IA, not a visual-design afterthought.

## 15. Error states

Consistent, non-alarming error-state patterns across the product: a failed data load should offer a retry action, not just an error message; a permission-denied state should explain *why* in general terms ("you don't have access to this section") without leaking information about what exists behind that boundary (a subtle but real security-adjacent UX consideration — an error message shouldn't confirm the existence of data the user isn't entitled to know about).

## 16. Open questions

- OQ-24: Should "Expenses" (Module 7's employee-facing submission view) be its own top-level section, or nested under "Payroll"? Listed separately per the brief's own section list, but there's a real IA argument for merging them from the employee's perspective (they think of "my payslip and my expense claims" as related, not separate destinations) — flagged for a UX-research-informed decision, not resolved definitively here.
- OQ-25: Command search's exact trigger mechanism (keyboard shortcut, persistent search-bar mode) is an interaction-design decision better suited to the visual-design phase this document explicitly defers — flagged, not decided.
