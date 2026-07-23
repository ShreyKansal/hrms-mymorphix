-- Fix: the previous migration's policies (USING with no explicit WITH CHECK) apply the
-- same tenant-match condition to INSERT as to SELECT/UPDATE/DELETE. That's correct for
-- every table except the three involved in tenant *provisioning* (tenants, organisations,
-- legal_entities) — provisioning a brand-new tenant is, by definition, an operation with
-- no existing tenant context to scope against (docs/hrms-prd/modules/22-system-administration.md
-- §7.1's "bootstrapping problem": nobody has a role to grant before the first tenant exists).
--
-- Fix: split each policy into a read/write-existing-rows policy (still fully tenant-scoped)
-- and a separate INSERT policy. For the three provisioning tables, INSERT is unconditional
-- — safe because the *value* written still comes only from application code
-- (TenantsService.provision), and RLS's actual job — stopping tenant A's session from
-- reading or modifying tenant B's rows — is unaffected by this. For every other table,
-- INSERT stays tenant-scoped, since a normal request always has real tenant context by then.
--
-- Note: Postgres requires one command per CREATE POLICY (SELECT, INSERT, UPDATE, or DELETE
-- individually — "FOR SELECT, UPDATE, DELETE" is not valid syntax), hence three separate
-- statements per table below instead of one combined one.

-- tenants
DROP POLICY tenant_isolation_tenants ON tenants;
CREATE POLICY tenant_isolation_tenants_select ON tenants
  FOR SELECT
  USING (id::text = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_tenants_update ON tenants
  FOR UPDATE
  USING (id::text = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_tenants_delete ON tenants
  FOR DELETE
  USING (id::text = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_tenants_insert ON tenants
  FOR INSERT
  WITH CHECK (true);

-- organisations
DROP POLICY tenant_isolation_organisations ON organisations;
CREATE POLICY tenant_isolation_organisations_select ON organisations
  FOR SELECT
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_organisations_update ON organisations
  FOR UPDATE
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_organisations_delete ON organisations
  FOR DELETE
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_organisations_insert ON organisations
  FOR INSERT
  WITH CHECK (true);

-- legal_entities
DROP POLICY tenant_isolation_legal_entities ON legal_entities;
CREATE POLICY tenant_isolation_legal_entities_select ON legal_entities
  FOR SELECT
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_legal_entities_update ON legal_entities
  FOR UPDATE
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_legal_entities_delete ON legal_entities
  FOR DELETE
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_legal_entities_insert ON legal_entities
  FOR INSERT
  WITH CHECK (true);

-- Every other tenant-scoped table: FOR ALL is fine here (single CREATE POLICY covers
-- SELECT/INSERT/UPDATE/DELETE) because we want every command tenant-scoped, not split.
DROP POLICY tenant_isolation_departments ON departments;
CREATE POLICY tenant_isolation_departments_all ON departments
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY tenant_isolation_locations ON locations;
CREATE POLICY tenant_isolation_locations_all ON locations
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY tenant_isolation_designations ON designations;
CREATE POLICY tenant_isolation_designations_all ON designations
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY tenant_isolation_grades ON grades;
CREATE POLICY tenant_isolation_grades_all ON grades
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY tenant_isolation_employees ON employees;
CREATE POLICY tenant_isolation_employees_all ON employees
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY tenant_isolation_employment_assignments ON employment_assignments;
CREATE POLICY tenant_isolation_employment_assignments_all ON employment_assignments
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY tenant_isolation_compensations ON compensations;
CREATE POLICY tenant_isolation_compensations_all ON compensations
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY tenant_isolation_users ON users;
CREATE POLICY tenant_isolation_users_all ON users
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY tenant_isolation_roles ON roles;
CREATE POLICY tenant_isolation_roles_all ON roles
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));
