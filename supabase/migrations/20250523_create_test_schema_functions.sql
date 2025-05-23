
-- Function to get table definition (already exist but included for completeness)
CREATE OR REPLACE FUNCTION public.pg_get_tabledef(p_schema text, p_table text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    v_table_ddl text;
    column_record record;
    table_rec record;
BEGIN
    -- Get the basic table structure
    SELECT 'CREATE TABLE ' || p_schema || '.' || p_table || ' (' INTO v_table_ddl;

    -- Get the table columns
    FOR column_record IN 
        SELECT 
            column_name, 
            data_type, 
            coalesce(character_maximum_length::text, '') as max_length,
            is_nullable,
            column_default
        FROM 
            information_schema.columns
        WHERE 
            table_schema = p_schema AND table_name = p_table
        ORDER BY 
            ordinal_position 
    LOOP
        v_table_ddl := v_table_ddl || E'\n  ' || column_record.column_name || ' ' || column_record.data_type;
        
        -- Add length if exists
        IF column_record.max_length <> '' THEN
            v_table_ddl := v_table_ddl || '(' || column_record.max_length || ')';
        END IF;
        
        -- Add nullable constraint
        IF column_record.is_nullable = 'NO' THEN
            v_table_ddl := v_table_ddl || ' NOT NULL';
        END IF;
        
        -- Add default if exists
        IF column_record.column_default IS NOT NULL THEN
            v_table_ddl := v_table_ddl || ' DEFAULT ' || column_record.column_default;
        END IF;
        
        -- Add column separator
        v_table_ddl := v_table_ddl || ',';
    END LOOP;

    -- Get primary key constraint
    FOR table_rec IN
        SELECT 
            kcu.column_name,
            tc.constraint_name
        FROM 
            information_schema.table_constraints tc
        JOIN 
            information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE 
            tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema = p_schema
            AND tc.table_name = p_table
    LOOP
        v_table_ddl := v_table_ddl || E'\n  ' || 'CONSTRAINT ' || table_rec.constraint_name || ' PRIMARY KEY (' || table_rec.column_name || ')';
        -- No comma needed after primary key if it's the last constraint
    END LOOP;

    -- Remove trailing comma if any
    IF v_table_ddl LIKE '%,' THEN
        v_table_ddl := substr(v_table_ddl, 1, length(v_table_ddl) - 1);
    END IF;

    v_table_ddl := v_table_ddl || E'\n);';
    
    RETURN v_table_ddl;
END;
$$;

-- Create a function to replicate all tables from one schema to another
CREATE OR REPLACE FUNCTION testing.replicate_all_tables(source_schema TEXT, target_schema TEXT)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    tables CURSOR FOR 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = source_schema
        AND table_type = 'BASE TABLE';
    table_def TEXT;
BEGIN
    -- Create the target schema if it doesn't exist
    EXECUTE 'CREATE SCHEMA IF NOT EXISTS ' || target_schema;
    
    -- Loop through all tables in the source schema
    FOR table_record IN tables LOOP
        -- Get the table definition
        SELECT public.pg_get_tabledef(source_schema, table_record.table_name) INTO table_def;
        
        -- Replace schema name in the definition
        table_def := REPLACE(table_def, source_schema || '.', target_schema || '.');
        
        -- Create the table in the target schema
        EXECUTE table_def;
    END LOOP;
END;
$$;

-- Create a function to execute SQL in specific schemas
CREATE OR REPLACE FUNCTION testing.exec_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE query;
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to list all schemas starting with 'test_'
CREATE OR REPLACE FUNCTION testing.list_test_schemas()
RETURNS TABLE (
  schema_name text,
  created timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.nspname::text,
    COALESCE(
      (SELECT create_time FROM pg_stat_user_tables 
       WHERE schemaname = n.nspname 
       ORDER BY create_time ASC 
       LIMIT 1),
      now()
    ) as created_time
  FROM pg_catalog.pg_namespace n
  WHERE n.nspname LIKE 'test_%';
END;
$$;

-- Function to create a unique test schema
CREATE OR REPLACE FUNCTION testing.create_unique_schema(base_prefix text DEFAULT 'test')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  unique_id text;
  schema_name text;
BEGIN
  -- Generate a random ID for uniqueness
  SELECT substr(md5(random()::text || clock_timestamp()::text), 1, 16) INTO unique_id;
  
  -- Create schema name
  schema_name := base_prefix || '_' || unique_id;
  
  -- Create the schema
  EXECUTE 'CREATE SCHEMA IF NOT EXISTS ' || schema_name;
  
  RETURN schema_name;
END;
$$;

-- Add this function to forward calls to the testing schema
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'testing'
AS $$
BEGIN
  -- Forward the call to the testing schema function
  PERFORM testing.exec_sql(query);
END;
$$;
