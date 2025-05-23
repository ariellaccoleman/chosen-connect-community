
-- Create testing schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS testing;

-- Function to clean all data in the testing schema
CREATE OR REPLACE FUNCTION testing.clean_all_data()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_rec record;
BEGIN
  -- Get all tables in the testing schema
  FOR table_rec IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'testing'
  LOOP
    EXECUTE 'TRUNCATE TABLE testing.' || table_rec.tablename || ' CASCADE;';
  END LOOP;
END;
$$;

-- Function to replicate table structure between schemas
CREATE OR REPLACE FUNCTION testing.replicate_table_structure(
  source_schema TEXT,
  target_schema TEXT,
  table_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  create_table_sql TEXT;
BEGIN
  -- Get the CREATE TABLE statement
  SELECT pg_get_tabledef(source_schema, table_name) INTO create_table_sql;
  
  -- Modify to use target schema
  create_table_sql := REPLACE(create_table_sql, source_schema || '.', target_schema || '.');
  
  -- Execute the modified statement
  EXECUTE create_table_sql;
  
  -- Strip foreign key constraints as they might reference tables we don't have in testing
  -- This allows us to have a clean schema for testing without foreign key constraints
  FOR i IN (
    SELECT 
      conname AS constraint_name
    FROM 
      pg_constraint pc
      JOIN pg_class c ON c.oid = pc.conrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE 
      n.nspname = target_schema AND 
      relname = table_name AND
      contype = 'f'
  ) LOOP
    EXECUTE 'ALTER TABLE ' || target_schema || '.' || table_name || ' DROP CONSTRAINT ' || i.constraint_name;
  END LOOP;
END;
$$;

-- Function to replicate all tables from one schema to another
CREATE OR REPLACE FUNCTION testing.replicate_all_tables(
  source_schema TEXT,
  target_schema TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_rec record;
BEGIN
  -- Create the schema if it doesn't exist
  EXECUTE 'CREATE SCHEMA IF NOT EXISTS ' || target_schema;
  
  -- Get all tables from the source schema
  FOR table_rec IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = source_schema
  LOOP
    -- Skip special tables
    IF table_rec.tablename NOT LIKE 'pg_%' AND table_rec.tablename NOT IN ('schema_migrations') THEN
      -- Check if table already exists in target schema
      IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = target_schema AND tablename = table_rec.tablename
      ) THEN
        -- Replicate table structure
        PERFORM testing.replicate_table_structure(source_schema, target_schema, table_rec.tablename);
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION testing.clean_all_data TO authenticated;
GRANT EXECUTE ON FUNCTION testing.clean_all_data TO service_role;
GRANT EXECUTE ON FUNCTION testing.replicate_table_structure TO authenticated;
GRANT EXECUTE ON FUNCTION testing.replicate_table_structure TO service_role;
GRANT EXECUTE ON FUNCTION testing.replicate_all_tables TO authenticated;
GRANT EXECUTE ON FUNCTION testing.replicate_all_tables TO service_role;
