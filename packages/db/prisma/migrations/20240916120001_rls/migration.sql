-- Runtime role grants and FORCE ROW LEVEL SECURITY.
-- App connections use icra360_app; migrations use superuser icra360.

GRANT USAGE ON SCHEMA public TO icra360_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO icra360_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO icra360_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO icra360_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO icra360_app;

-- Permissions catalog is global; app may only read.
REVOKE INSERT, UPDATE, DELETE ON TABLE permissions FROM icra360_app;
GRANT SELECT ON TABLE permissions TO icra360_app;

CREATE OR REPLACE FUNCTION app_current_tenant() RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid
$$;

DO $$
DECLARE
  tenant_table text;
BEGIN
  FOREACH tenant_table IN ARRAY ARRAY[
    'tenants',
    'companies',
    'workplaces',
    'users',
    'roles',
    'role_permissions',
    'user_roles',
    'employees',
    'employments',
    'audit_logs'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tenant_table);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tenant_table);
  END LOOP;
END
$$;

CREATE POLICY tenants_isolation ON tenants
  USING (id = app_current_tenant())
  WITH CHECK (id = app_current_tenant());

CREATE POLICY companies_isolation ON companies
  USING (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

CREATE POLICY workplaces_isolation ON workplaces
  USING (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

CREATE POLICY users_isolation ON users
  USING (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

CREATE POLICY roles_isolation ON roles
  USING (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

CREATE POLICY role_permissions_isolation ON role_permissions
  USING (
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_permissions.role_id AND r.tenant_id = app_current_tenant()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_permissions.role_id AND r.tenant_id = app_current_tenant()
    )
  );

CREATE POLICY user_roles_isolation ON user_roles
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_roles.user_id AND u.tenant_id = app_current_tenant()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_roles.user_id AND u.tenant_id = app_current_tenant()
    )
  );

CREATE POLICY employees_isolation ON employees
  USING (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

CREATE POLICY employments_isolation ON employments
  USING (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

CREATE POLICY audit_logs_isolation ON audit_logs
  USING (tenant_id IS NULL OR tenant_id = app_current_tenant())
  WITH CHECK (tenant_id IS NULL OR tenant_id = app_current_tenant());
