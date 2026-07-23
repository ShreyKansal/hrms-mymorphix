# Sprint 1 Verification Evidence

**Status:** Foundation-phase walking skeleton (subset of Module 1 + Module 22) built and verified end-to-end via real browser automation, not just "it compiles."
**Date:** 2026-07-23

---

## What was actually built

A working slice of Module 1 (Core HR) and Module 22 (System Administration): tenant provisioning, employee creation, and the effective-dated Employment Assignment transfer pattern — the single most important idea in the whole data model — running against a real PostgreSQL database with real Row-Level Security, served by a real NestJS API, rendered by a real React + Atlaskit frontend.

This is **not** the full Foundation phase (Module 21's real permission UI, Module 17's workflow engine, and Module 18's notifications aren't built yet) — it's the smallest slice that proves the core architecture actually works, per standard "walking skeleton" practice.

## How this was verified (not just claimed)

1. **Database layer:** `psql` used directly (bypassing the app entirely) to prove Row-Level Security blocks cross-tenant reads even with zero `WHERE` clause in the query — see the terminal transcript in this session. A superuser connection was deliberately replaced with a locked-down `hrms_app` role specifically because superusers bypass RLS by default, which would have made the policies real in the schema but inert in practice.
2. **API layer:** exercised via `curl` — provisioned two separate tenants, created an employee under one, then proved the other tenant's session (even with a corresponding `WHERE tenantId = ...` in the app code) genuinely cannot read it. HTTP 404, not 403 — deliberately, so a would-be attacker can't even confirm the record exists.
3. **Frontend layer:** exercised via Playwright driving real Chromium, not manual inspection — `apps/web/e2e/foundation-smoke-test.mjs`, now a permanent regression test, not a throwaway script.

## Screenshots

- `1-setup.png` — the tenant setup wizard (Module 22's bootstrapping flow).
- `2-directory.png` — Employee Directory, empty state ("No employees yet — add your first one to get started").
- `3-modal.png` — the Add Employee modal, open (this exact screenshot is what caught Bug #1 below — the first version of this screenshot showed the modal *not* present).
- `4-created.png` — the directory after creation, showing a real generated Employee ID and DRAFT status.

## Two real bugs found and fixed by this verification — neither was visible from TypeScript compiling cleanly

### Bug 1: `@atlaskit/modal-dialog` closes itself immediately under React 18 StrictMode

**Symptom:** clicking "Add employee" appeared to do nothing — no error, no console warning about it, the modal component demonstrably rendered (visible in React's own internal warning stack trace) and then vanished before the next screenshot.
**Root cause:** React 18 StrictMode intentionally double-invokes mount effects in development. This modal version's outside-click-detection effect gets caught by that double-invocation in a way that makes it treat its own opening click as a click-outside, and closes immediately.
**Fix:** removed `<StrictMode>` from `apps/web/src/main.tsx`, with a code comment explaining why — this is a genuine upstream Atlaskit/React-18 compatibility gap, not an app bug. Flagged against [00-existing-system-audit.md](../../hrms-prd/00-existing-system-audit.md) OQ-3 (component status sweep) — revisit if a future Atlaskit release fixes it, since StrictMode's dev-time bug-surfacing is genuinely valuable to have back.

### Bug 2: an untouched optional field fails validation instead of being treated as absent

**Symptom:** creating an employee while leaving the optional "Personal email" field blank returned HTTP 400.
**Root cause:** `@atlaskit/form` always submits every declared field's current value, including untouched ones — an empty string `""`, never `undefined`. `class-validator`'s `@IsOptional()` only skips remaining validators for `null`/`undefined`; `""` is neither, so `@IsEmail()` still ran and rejected the empty string.
**Fix:** added `apps/api/src/common/empty-string-to-undefined.ts`, a reusable `@EmptyStringToUndefined()` decorator applied before `@IsOptional()` on every optional DTO field. This isn't a one-off patch — it's a general fix that every future module's DTOs need too, since every one of them has optional fields and every one of them will receive this exact shape of submission from Atlaskit forms.

**Why this matters beyond these two bugs:** both were invisible to `tsc --noEmit` (which passed cleanly both times) and invisible to the dev server starting without errors. Only clicking through the actual running app caught them. This is the concrete argument for why every module going forward should get the same real-browser verification before being called done, not just a clean compile.

### Bug 3 (found 2026-07-24, more serious than the first two): the API was silently running as the Postgres superuser, not the RLS-restricted role — meaning Row-Level Security had been inert, not enforced, for part of this session

**Symptom:** none visible from the outside — every functional test (Bugs 1 and 2's fixes, the original RLS cross-tenant-isolation test) still passed. Caught only by directly querying `pg_stat_activity` and noticing every connection to `hrms_dev` was `usename=postgres`, never `hrms_app`.
**Root cause:** `~/hrms-env.sh` (this project's local dev environment script, sourced before almost every command in this session) exported `DATABASE_URL` pointing at the `postgres` superuser — added early on, for root-level Prisma migration commands, which genuinely do need superuser/DDL rights. `apps/api/.env` separately declared `DATABASE_URL` pointing at the restricted `hrms_app` role, specifically so Row-Level Security would apply to the running app. The problem: `dotenv` (which `@nestjs/config` uses to load `.env` files) does **not** override a variable that's already present in `process.env` by default — and since the shell already had `DATABASE_URL` set from `hrms-env.sh` before `apps/api/.env` ever loaded, the shell's value silently won. **Superusers bypass Row-Level Security by default in Postgres** — so for however much of this session the API ran this way, the RLS policies were real in the schema but doing nothing at runtime, even though the app-level `WHERE tenantId = ...` filters (a second, independent layer of protection) were still correctly in place the whole time.
**Fix:** renamed the shell-level variable to `MIGRATE_DATABASE_URL` (never exported as bare `DATABASE_URL`, so it can't collide again), referenced explicitly and only where actually needed (`npm run db:migrate`/`db:studio`). `apps/api/.env` is now the sole, unambiguous source of `DATABASE_URL` for the running app.
**A second, real bug this fix immediately surfaced:** once the API genuinely ran as `hrms_app` for the first time, tenant provisioning started failing with `new row violates row-level security policy for table "tenants"`. Root cause: Postgres RLS's `INSERT ... RETURNING` (which Prisma's `.create()` always uses) requires the newly-inserted row to also satisfy the table's **SELECT** policy, not just its INSERT policy — and a brand-new tenant has no `app.current_tenant_id` session value yet to match against, since no tenant exists until this exact transaction creates one. The original fix for this (a special "unconditional INSERT allowed" policy) papered over the symptom without fixing the actual gap, and was itself never exercised for real until the superuser bug was fixed. **Correct fix:** generate the tenant's UUID in application code (`apps/api/src/tenants/tenants.service.ts`) and set the RLS session variable to that ID *before* the first insert, so tenant provisioning runs under the same uniformly-scoped policy every other write in the app uses — no special-cased policy needed at all. See `prisma/migrations/20260724010000_rls_tenant_provisioning_fix/`.
**Verified via:** restarted the API, confirmed via a fresh `pg_stat_activity` query that its connection is genuinely `usename=hrms_app`, re-ran the full cross-tenant-isolation check (tenant B still correctly gets a 404 on tenant A's data) and the full Playwright regression suite — all passing under the corrected connection, not the superuser one this time.

**The pattern across all three bugs:** none were caught by a clean TypeScript compile, a healthy-looking `/health` endpoint, or the app appearing to work correctly end-to-end. Bug 3 specifically is the sharpest example — the app was fully functional and every prior test passed, while a real security control was silently disabled. The concrete lesson: functional correctness and security-control correctness are separate things that both need their own explicit verification, especially for anything involving Row-Level Security, connection roles, or environment-variable precedence across multiple `.env`/shell-profile layers.
