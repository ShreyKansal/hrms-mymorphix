-- Row-Level Security for tenant isolation.
-- Implements docs/hrms-prd/10-security-privacy-audit.md §1: "structural, not just
-- application-logic" tenant isolation. Even a bug in application code (a missing
-- WHERE tenantId = ... clause) cannot leak data across tenants once this is in place —
-- Postgres itself refuses the query.
--
-- How it works: every tenant-scoped table gets a policy that only allows access to rows
-- where tenant_id matches the Postgres session variable 'app.current_tenant_id'. The
-- NestJS PrismaService sets that variable at the start of every request (see
-- apps/api/src/prisma/prisma.service.ts) via SET LOCAL inside a transaction.
--
-- IMPORTANT: the application's database role must NOT be a superuser and must NOT have
-- BYPASSRLS — superusers bypass RLS by default in Postgres, which would silently defeat
-- this entire migration. The local dev setup currently connects as the `postgres`
-- superuser for convenience; before this matters for real, create a dedicated
-- non-superuser `hrms_app` role and switch DATABASE_URL to use it.

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compensations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- tenants itself is keyed by id, not tenant_id — special-cased policy.
CREATE POLICY tenant_isolation_tenants ON tenants
  USING (id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_organisations ON organisations
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_legal_entities ON legal_entities
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_departments ON departments
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_locations ON locations
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_designations ON designations
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_grades ON grades
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_employees ON employees
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_employment_assignments ON employment_assignments
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_compensations ON compensations
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_users ON users
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_roles ON roles
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

-- role_assignments has no tenant_id column directly (it hangs off User/Role, both of
-- which are already tenant-isolated) — no policy needed there, it inherits isolation
-- transitively through its foreign keys being unreadable cross-tenant.
