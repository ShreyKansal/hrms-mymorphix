# Build Guide — Module 22: System Administration

**Full spec:** [modules/22-system-administration.md](../../hrms-prd/modules/22-system-administration.md)
**Sprint:** Foundation, Sprint 5 (paired with Module 18).

---

## What this module is, in one paragraph

The settings area that turns a generic product into *this specific customer's* configured instance — company setup, SSO, custom fields, numbering schemes, calendars. The most important design idea: **a brand-new small customer should be able to finish setup in a few minutes without seeing options they don't need yet.** Don't front-load every possible configuration screen.

## Screens to build

1. **Tenant Setup Wizard** — the very first thing a new customer sees. Step 1: company name, one legal entity, one default location. Step 2: financial year / leave year start dates. Step 3 (optional, skippable): SSO setup. Step 4: done, land on an empty-but-friendly dashboard. This is the *first* Employee/first System Administrator account bootstrapping problem — solve it here, since normal role-assignment (Module 21) needs someone to already have access to grant it.
2. **Authentication Settings** — SSO (SAML/OIDC) configuration, MFA policy, password policy, session timeout, IP allowlisting. Keep this in a clearly separated section from everything else, since it's genuinely IT-Administrator territory, distinct from HR-domain settings (see below).
3. **Custom Fields** — let an admin add a field to the Employee form (Module 1) without a code change: field name, type (text/number/date/dropdown), which form it appears on. Simple version for Foundation phase; don't over-engineer this into a full custom-form builder yet.
4. **Numbering Schemes** — configure the format for Employee IDs (e.g., "EMP-{sequence}" vs "{location-code}-{sequence}").
5. **Calendars** — financial year, leave year, and holiday calendar setup (a list of dates + which locations they apply to).
6. **Data Import** — CSV upload with a column-mapping step, a validation-preview ("here's what will be created, here's what has errors") before committing, never a silent all-or-nothing import.

## An important, easy-to-miss permission rule

**Keep "who can configure SSO/security" and "who can see HR data" as two completely separate grantable permissions**, even though both might loosely feel like "admin stuff." A common real-world mistake is bundling them so IT staff end up with employee compensation visibility just because they manage SSO. Don't do that — build these as two distinct capabilities from day one (this ties directly into Module 21).

## Key user flow: new tenant setup

1. New customer signs up → wizard starts automatically.
2. They fill in company basics → backend creates the Tenant, Organisation, and first Legal Entity records, and creates their account as the first System Administrator (a special bootstrapping path, not the normal Module 21 role-assignment flow, since no one exists yet to grant them access).
3. They can skip SSO/custom-fields/import steps and come back to them later from the Settings menu — never force it all up front.

## API endpoints

```
POST   /api/v1/tenants                    — the setup-wizard's create action
PATCH  /api/v1/tenants/:id/settings        — auth policy, calendars, etc.
GET/POST/PATCH  /api/v1/custom-fields
GET/PATCH       /api/v1/numbering-schemes
POST            /api/v1/data-imports       — kicks off an async import job (see architecture doc §5 on BullMQ)
GET             /api/v1/data-imports/:id   — poll status/results
```

## What "done" looks like

- A brand-new signup can complete setup and reach a working (if empty) dashboard in a few minutes, without being forced through SSO/custom-fields/import configuration they don't need yet.
- A CSV import with some bad rows shows a clear, specific error report and doesn't silently create partial/broken records.
- An IT Administrator account with only authentication-settings permission genuinely cannot browse the employee directory's compensation data.

## Enterprise-phase addendum: Sandbox and Feature Flags

**Sandbox:** a data-isolated copy of a tenant's configuration for testing changes (a new workflow rule, a new custom field) before they hit production — default to synthetic/anonymised data in the sandbox, not a real copy of employee PII, unless a tenant explicitly opts in and that's logged. **Feature flags:** a simple per-tenant toggle table for rolling out new capabilities gradually rather than a hard cutover for everyone at once — useful for exactly the kind of staggered AI-capability rollout Module 25 requires.
