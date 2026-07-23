# 00 — Architecture and Tech Stack

**Status:** PM-proposed defaults, pending final engineering-lead sign-off. Every decision below is written to be **changeable** — it resolves open questions from the PRD so the team can start building, not to lock in choices no one has actually reviewed.
**Audience:** every developer and designer on the project. Read this before touching any Module Build Guide.
**Resolves:** [00-existing-system-audit.md](../hrms-prd/00-existing-system-audit.md) OQ-1, OQ-2, OQ-3, OQ-4; [09-api-and-event-planning.md](../hrms-prd/09-api-and-event-planning.md) OQ-28, OQ-29; [modules/24-mobile-experience.md](../hrms-prd/modules/24-mobile-experience.md) OQ-2.

---

## 1. The one-sentence version

**React + TypeScript frontend on Atlaskit, a NestJS + TypeScript backend, PostgreSQL as the single source of truth, REST APIs, React Native for mobile, everything on AWS (Mumbai region), one monorepo.**

## 2. Frontend

- **Framework: React + TypeScript.** Not really a choice — Atlaskit's ~90 components are React components ([00-existing-system-audit.md](../hrms-prd/00-existing-system-audit.md) §2). TypeScript because a 27-module product with this much cross-module data flowing through shared types needs compile-time safety, not runtime surprises.
- **Styling: Atlaskit design tokens exclusively.** Never a hardcoded hex/px value — always `token('space.200')`, `token('color.background....')`. This is not a style preference, it's how dark mode and any future rebrand work at all.
- **State management:**
  - **Server state:** TanStack Query (React Query). Every screen's "fetch this record, cache it, refetch on mutation" pattern goes through this — it gives us the optimistic-concurrency and stale-data-freshness behavior the PRD requires ([09-api-and-event-planning.md](../hrms-prd/09-api-and-event-planning.md) §7, §11) without hand-rolling it per module.
  - **Client state (UI-only, not server data):** React Context + `useState`/`useReducer` for anything local to a screen. No Redux — with TanStack Query owning server state, there's rarely enough leftover client state to justify it, and every module PRD's own emphasis on simplicity argues against extra ceremony.
  - **Form state:** `@atlaskit/form`'s own built-in state management ([00-existing-system-audit.md](../hrms-prd/00-existing-system-audit.md) §5) — do not introduce React Hook Form or Formik. Atlaskit's Form already does field-level and submission-level validation; a second form library would fight it.
- **Routing:** React Router.
- **Component library beyond Atlaskit:** none, by default. If a Module Build Guide calls for something Atlaskit doesn't ship (e.g., the custom bulk-select pattern from [16-product-decision-log.md](../hrms-prd/16-product-decision-log.md) D-012), it gets built once as a shared internal component in `packages/ui-shared`, reused everywhere — never rebuilt per module.

## 3. Backend

- **Language/runtime: TypeScript on Node.js.** One language across frontend and backend means an intern or designer-turned-developer can move between the two without a context switch, and shared types (a `packages/shared-types` package) can be imported by both without duplication or drift — directly reinforcing the PRD's "single source of truth, no drift" principle at the code level, not just the data-model level.
- **Framework: NestJS.** Chosen over a bare Express app because this product has 27 modules that each need the same shape of thing (controllers, services, permission guards, validation pipes) — NestJS's module system maps almost one-to-one onto this PRD's own module boundaries, and its built-in dependency injection and Guards are the natural place to implement Module 21's "every API call enforces the permission model at the backend" requirement ([10-security-privacy-audit.md](../hrms-prd/10-security-privacy-audit.md) §11) as a single, impossible-to-forget cross-cutting layer, rather than a permission check someone has to remember to add in every controller by hand.
- **ORM: Prisma.** Type-safe queries (catches a wrong field name at compile time, not in production), a real migration system (critical given how much of [05-organisation-data-model.md](../hrms-prd/05-organisation-data-model.md) depends on schema correctness), and it generates the shared TypeScript types the frontend also consumes.
- **API style: REST**, per [09-api-and-event-planning.md](../hrms-prd/09-api-and-event-planning.md) §1's own recommendation — versioned via URL path (`/api/v1/...`).

## 4. Database

- **PostgreSQL, single primary database for all tenants (row-level tenant-ID scoping), one physical database, not one-database-per-tenant.** Rationale: Postgres gives us real ACID transactions (non-negotiable for Module 6 Payroll — a payroll run either fully commits or fully rolls back, never half), native JSON columns for the custom-fields flexibility [modules/22-system-administration.md](../hrms-prd/modules/22-system-administration.md) needs without a schema migration per tenant, and mature row-level-security features that give [10-security-privacy-audit.md](../hrms-prd/10-security-privacy-audit.md) §1's "structural, not just application-logic" tenant isolation a real technical mechanism: **every table carries a `tenant_id`, and Postgres Row-Level Security policies enforce it at the database layer** — even a bug in application code cannot leak across tenants, because the database itself refuses the query.
- **The Employment Assignment pattern ([05-organisation-data-model.md](../hrms-prd/05-organisation-data-model.md) §7) is implemented as literal append-only tables** — `effective_from`/`effective_to`/`created_at` columns, indexed on `(employee_id, effective_from)` exactly as that document specifies. This is the single most important table design decision in the schema; get the index right before writing any queries against it.
- **Caching/session/queue: Redis.** Used for (a) session storage, (b) TanStack-Query-adjacent server-side caching where needed, (c) the job queue below.
- **File storage: S3-compatible object storage** (AWS S3), with pre-signed-URL direct upload for documents/receipts/resumes per [09-api-and-event-planning.md](../hrms-prd/09-api-and-event-planning.md) §11 — files never pass through the NestJS app server as a proxy.

## 5. Async jobs and long-running operations

**BullMQ (Redis-backed)** for everything [09-api-and-event-planning.md](../hrms-prd/09-api-and-event-planning.md) §12/§13 flagged as needing an async-job pattern: payroll run processing, bulk imports, large report exports, statutory-report generation. A job has a status a client can poll (or gets notified on completion via Module 18) — never a synchronous HTTP request left hanging on a multi-thousand-row operation.

## 6. Domain events

Implemented as an internal event bus for now (NestJS's built-in `EventEmitter`, or a lightweight in-process pattern), **not** a separate message broker (Kafka, etc.) at MVP — [09-api-and-event-planning.md](../hrms-prd/09-api-and-event-planning.md) OQ-29 flagged this as an infrastructure decision; for a single-region, single-database MVP, an in-process event bus with the exact same event contracts documented in that file is sufficient and dramatically simpler to operate. **Revisit if/when the product needs true service decomposition** (multiple independently-deployed services) — the event *contracts* are designed to survive that migration unchanged, only the transport would change.

## 7. Authentication

- **Password auth:** argon2 for hashing (not bcrypt — argon2 is the current best-practice default).
- **Session/token:** short-lived JWT access tokens + long-lived, rotatable refresh tokens, stored in httpOnly cookies (not localStorage, to reduce XSS-token-theft risk).
- **SSO (Module 22):** SAML and OIDC support via `passport-saml` / `openid-client` — every tenant can bring their own identity provider (Entra ID, Google Workspace, Okta) on top of this.
- **MFA:** TOTP-based (authenticator-app), via a standard library — no custom crypto.

## 8. Mobile — resolving OQ-2

**React Native**, not a fully separate native (Swift/Kotlin) build, and not a responsive-web-only approach. Rationale: it lets the same team and largely the same component/design-token thinking extend to mobile ([00-existing-system-audit.md](../hrms-prd/00-existing-system-audit.md) A2 flagged that Atlaskit itself is web-only, so mobile screens are still custom-built, not literally reused Atlaskit components — but the *design tokens* and much of the *business logic/API layer* are shared); and it gives [modules/24-mobile-experience.md](../hrms-prd/modules/24-mobile-experience.md) §7.1's offline-capture-and-sync requirement (check-in/out working with unreliable connectivity) a real, mature local-storage/background-sync story that a pure web app can't match as reliably. **This resolves OQ-2** — flag to the user/engineering lead for final confirmation, but proceed on this basis unless told otherwise.

## 9. Hosting and data residency

**AWS, `ap-south-1` (Mumbai) region as primary**, directly answering [10-security-privacy-audit.md](../hrms-prd/10-security-privacy-audit.md) §16's data-residency requirement for an India-first product: RDS for PostgreSQL (managed backups, point-in-time recovery — the "verified-restorable" requirement from that section becomes a scheduled, tested RDS snapshot-restore drill), ElastiCache for Redis, ECS Fargate for the backend (containerized, no server management), S3 for files, CloudFront for the frontend.

## 10. Repository structure

**One monorepo** (Turborepo), not separate repos per module or per app:

```
/apps
  /web        — React frontend
  /mobile     — React Native app
  /api        — NestJS backend
/packages
  /shared-types    — TypeScript types generated from Prisma + hand-written domain types
  /ui-shared       — custom components built on Atlaskit primitives (bulk-select, etc.)
  /permissions     — the Module 21 permission-check library, imported by every backend module
/prisma
  schema.prisma    — the full database schema, one file, organised by the module groupings in 08-conceptual-data-model.md
```

One repo because this product's whole value proposition is a *unified* data model — splitting it into microservices/multi-repo before there's a real scaling reason to would recreate the "modules that don't talk to each other cleanly" failure mode the entire PRD is designed against, at the engineering-org level instead of the product level.

## 11. Testing

- **Unit/integration:** Vitest (backend and frontend both — one test runner, less config).
- **End-to-end:** Playwright, covering at minimum every Cross-Module Workflow named in [06-cross-module-workflows.md](../hrms-prd/06-cross-module-workflows.md) as its own test scenario.
- **Every module's acceptance criteria (the Given/When/Then statements in each module PRD) map directly to a test case** — this is deliberate: the PRD was written so its acceptance criteria are already testable specifications, not prose to be reinterpreted into tests later.

## 12. CI/CD

GitHub Actions: lint + typecheck + unit tests on every PR; Playwright e2e suite on merge to `main`; deploy to a staging environment automatically, production deploy gated on manual approval (a deliberate, small amount of friction on the one action that matters most).

## 13. Resolving the specific open questions

| Open question (source) | Resolution here |
|---|---|
| OQ-1 — is direct `@atlaskit/*` npm package use the sanctioned path? | **Proceed on this assumption** — it's the only technically coherent path given the design system audit. Flag to whoever owns the Atlassian relationship (if any) to confirm licensing/support terms before GA; this does not block development starting. |
| OQ-2 (both audit and Module 24) — native vs. responsive web for mobile | **React Native**, per §8 above. |
| OQ-3 — component deprecation sweep | **Action item, not blocking:** before any screen uses an Atlaskit component beyond the ones already checked in the audit (`form`, `table`, `dynamic-table`, `modal-dialog`, `navigation-system`), check its status page. Add this as a checklist item in every Module Build Guide's "components" section. |
| OQ-4 — existing backend/infra standard to align with | **None found; this document is the standard**, until told otherwise. |
| [09] OQ-28 — REST vs. GraphQL | **REST**, per §3 above. |
| [09] OQ-29 — event transport | **In-process event bus at MVP**, per §6 above. |

## 14. What this document deliberately does not decide

Exact Prisma schema field-by-field (that's the first engineering task per module, derived from [08-conceptual-data-model.md](../hrms-prd/08-conceptual-data-model.md)), exact NestJS module boundaries beyond "roughly one per PRD module," CI/CD secrets management specifics, and production incident-response tooling. These are implementation details for the engineering team to work out following this document's direction, not decisions this PM-level document should make unilaterally.
