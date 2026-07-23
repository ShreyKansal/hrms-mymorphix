# HRMS

An India-first HRMS, built module by module against the full PRD in [`docs/hrms-prd/`](docs/hrms-prd/) and the build guides in [`docs/build/`](docs/build/). Start with [`docs/build/README.md`](docs/build/README.md) for how the documentation is organised.

**Current status:** Foundation-phase walking skeleton — tenant setup, employee creation, and the effective-dated transfer pattern — working end-to-end, verified via real browser automation. See [`docs/build/verification-evidence/README.md`](docs/build/verification-evidence/README.md).

---

## Environment note (read this before anything else)

This machine had **no admin/sudo access available** when this project started — no Homebrew, no Node, no Postgres. Everything below was installed entirely in user space as a result. This matters because the setup commands are non-standard (not `brew install postgresql`) — follow the commands in this file exactly, not generic tutorials.

## One-time setup (already done on this machine — reference only)

```bash
# Node.js via nvm (no sudo)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# nvm's loader is in ~/.zshenv (NOT ~/.zshrc — non-interactive shells only source .zshenv)
nvm install --lts

# PostgreSQL + Redis-compatible (Valkey) via micromamba (no sudo)
curl -Ls https://micro.mamba.pm/api/micromamba/osx-arm64/latest | tar -xvj bin/micromamba
~/bin/micromamba create -y -n hrms-dev -c conda-forge postgresql valkey-server

# GitHub CLI, standalone binary (no sudo) — used for auth + git push, since there was no
# Homebrew to install it the normal way either
# (binary sits in ~/bin/gh, already on PATH via ~/hrms-env.sh)
gh auth login   # one-time device-code flow: visit the printed URL, enter the code
gh auth setup-git
```

A single env file, `~/hrms-env.sh`, exports everything every command below needs (Node via nvm, Postgres/Valkey binaries via micromamba, `DATABASE_URL`, `REDIS_URL`). **Source it at the start of every terminal session:**

```bash
source ~/hrms-env.sh
```

## Running everything locally

### 1. Start the database and cache (if not already running)

```bash
source ~/hrms-env.sh
pg_ctl -D ~/hrms-local-data/pgdata -l ~/hrms-local-data/pglogs/postgres.log -o "-p 5432 -k /tmp" start
valkey-server --port 6379 --dir ~/hrms-local-data/valkey --logfile ~/hrms-local-data/valkey/valkey.log &
```

Check they're up: `pg_isready -h /tmp -p 5432` and `valkey-cli -p 6379 ping` (expect `PONG`).

### 2. Start the API

```bash
source ~/hrms-env.sh
cd apps/api && npx nest start --watch
```

Runs on `http://localhost:3000`. Health check: `curl http://localhost:3000/api/v1/health` — should return `{"status":"ok","db":"connected",...}`.

### 3. Start the web app

```bash
source ~/hrms-env.sh
cd apps/web && npx vite --port 5173
```

Open `http://localhost:5173` — first visit redirects to `/setup` (no tenant exists yet in a fresh database).

### 4. Run the end-to-end regression test

With both the API and web app running:

```bash
source ~/hrms-env.sh
cd apps/web && node e2e/foundation-smoke-test.mjs
```

Should print 8 `PASS` lines and `All checks passed.` If you haven't already: `npm install -D playwright && npx playwright install chromium` once, first time only.

## Database

- **Connection (app):** `postgresql://hrms_app:hrms_dev_local_only@localhost:5432/hrms_dev?host=/tmp` — a **non-superuser** role, deliberately, so Row-Level Security policies actually apply (superusers bypass RLS by default in Postgres — see `prisma/migrations/20260723180000_row_level_security/migration.sql`'s own comment on this).
- **Connection (migrations/admin):** the `postgres` superuser, same host/port/database.
- **Schema changes:** edit `prisma/schema.prisma`, then `npm run db:migrate` from the repo root (uses the superuser connection).
- **Inspect data:** `npm run db:studio`, or `psql -h /tmp -p 5432 -U postgres -d hrms_dev`.

## Project structure

```
apps/api/     — NestJS backend
apps/web/     — React + Atlaskit frontend (Vite)
apps/web/e2e/ — real-browser regression tests (Playwright)
packages/     — shared code (currently empty stubs — shared-types, ui-shared, permissions —
                 populated as more than one app needs something in common)
prisma/       — the database schema and migrations, single source of truth for the data model
docs/hrms-prd/ — the full product requirements (27 modules, personas, workflows, etc.)
docs/build/    — module-by-module build guides, backlogs, and this execution's own decisions
```

## Known issues / deliberate decisions (don't "fix" these without reading why)

- **`<StrictMode>` is intentionally removed** from `apps/web/src/main.tsx` — `@atlaskit/modal-dialog` has a genuine bug under React 18 StrictMode (see [`docs/build/verification-evidence/README.md`](docs/build/verification-evidence/README.md) Bug 1). Revisit if a newer Atlaskit release fixes it.
- **Every optional DTO field needs `@EmptyStringToUndefined()`** (`apps/api/src/common/empty-string-to-undefined.ts`) before `@IsOptional()` — Atlaskit forms submit untouched optional fields as `""`, not `undefined`. This is now a required pattern for every future module's DTOs, not a one-off fix.
- **`x-tenant-id` header / localStorage tenant ID is a temporary auth stand-in** (`apps/api/src/common/tenant-id.decorator.ts`, `apps/web/src/api/client.ts`) — replaced once Module 21 (Roles and Permissions) ships real authentication. Every controller using `@TenantId()` today has zero real permission enforcement yet.
- **`@atlaskit/page-layout` was dropped** from the frontend dependencies — its currently published version has a React-16-only peer dependency that wouldn't resolve. Plain layout (divs + Atlaskit primitives) used instead. Revisit if a compatible version ships.
