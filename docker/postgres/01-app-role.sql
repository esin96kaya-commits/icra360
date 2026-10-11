-- Application role used at runtime. Subject to FORCE ROW LEVEL SECURITY.
-- The POSTGRES_USER (icra360) remains superuser for migrations.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'icra360_app') THEN
    CREATE ROLE icra360_app LOGIN PASSWORD 'icra360_app_dev';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE icra360 TO icra360_app;
