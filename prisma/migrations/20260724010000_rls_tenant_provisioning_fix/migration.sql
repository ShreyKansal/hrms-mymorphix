-- Fixes a real bug in the previous migration's approach, only surfaced once the API
-- actually started connecting as the restricted `hrms_app` role instead of accidentally
-- running as the `postgres` superuser (see docs/build/verification-evidence/README.md
-- "Bug 3" — the DATABASE_URL environment-variable-precedence issue). Under the superuser
-- connection, RLS was silently bypassed the whole time, so this bug was never actually
-- exercised until now.
--
-- The bug: `INSERT ... RETURNING *` (which Prisma's .create() always does) doesn't just
-- need to pass the table's INSERT/WITH CHECK policy — the RETURNING clause also needs the
-- newly-inserted row to satisfy the table's SELECT policy, or Postgres refuses to hand it
-- back to the client at all ("new row violates row-level security policy"). The previous
-- migration's `WITH CHECK (true)` on INSERT was fine on its own, but tenant provisioning
-- has no `app.current_tenant_id` session value set yet (there's no tenant to scope to
-- until this transaction creates one) — so the implicit SELECT-for-RETURNING check on the
-- brand-new row always failed.
--
-- The real fix (application-side, see apps/api/src/tenants/tenants.service.ts): generate
-- the tenant's UUID in application code and set the session variable to that ID *before*
-- inserting, so the whole provisioning transaction runs under normal, consistent tenant
-- context from its very first statement — the same pattern every other tenant-scoped
-- write in the app already uses via PrismaService.withTenant(). That means the special-
-- cased "unconditional INSERT" policies from the previous migration are no longer needed
-- and are actively worse (they'd allow inserting a row into another tenant's table without
-- the normal tenant-context check) — replace them with the same uniform, fully-scoped
-- policy shape used everywhere else.

DROP POLICY tenant_isolation_tenants_select ON tenants;
DROP POLICY tenant_isolation_tenants_update ON tenants;
DROP POLICY tenant_isolation_tenants_delete ON tenants;
DROP POLICY tenant_isolation_tenants_insert ON tenants;
CREATE POLICY tenant_isolation_tenants_all ON tenants
  USING (id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (id::text = current_setting('app.current_tenant_id', true));

DROP POLICY tenant_isolation_organisations_select ON organisations;
DROP POLICY tenant_isolation_organisations_update ON organisations;
DROP POLICY tenant_isolation_organisations_delete ON organisations;
DROP POLICY tenant_isolation_organisations_insert ON organisations;
CREATE POLICY tenant_isolation_organisations_all ON organisations
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY tenant_isolation_legal_entities_select ON legal_entities;
DROP POLICY tenant_isolation_legal_entities_update ON legal_entities;
DROP POLICY tenant_isolation_legal_entities_delete ON legal_entities;
DROP POLICY tenant_isolation_legal_entities_insert ON legal_entities;
CREATE POLICY tenant_isolation_legal_entities_all ON legal_entities
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));
