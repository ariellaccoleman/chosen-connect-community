
# Migration to Schema-Based Testing

This document outlines the process of migrating from mock-based testing to schema-based testing using a dedicated `testing` schema in Supabase.

## Why Schema-Based Testing?

- **Database Validation**: Tests will run against a real database with real constraints, triggers, and functions
- **More Accurate Tests**: Eliminates inconsistencies between mock implementations and actual database behavior
- **Better Coverage**: Tests real SQL queries and database interactions
- **Unified Approach**: Same codebase can work with both test and production data

## Migration Plan Overview

1. Create Testing Schema & Replication Tools
2. Enhance Supabase Client for Schema Selection
3. Implement SchemaAwareRepository
4. Update Testing Infrastructure
5. Replace Mock Tests with Schema Tests

## Step 1: Create Testing Schema & Replication Tools

### 1.1 Schema Creation Script

```sql
-- Create testing schema
CREATE SCHEMA IF NOT EXISTS testing;

-- Grant access permissions
GRANT USAGE ON SCHEMA testing TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA testing TO authenticated, anon, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA testing TO authenticated, anon, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA testing TO authenticated, anon, service_role;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA testing
GRANT ALL ON TABLES TO authenticated, anon, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA testing
GRANT ALL ON SEQUENCES TO authenticated, anon, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA testing
GRANT ALL ON ROUTINES TO authenticated, anon, service_role;
```

### 1.2 Table Replication Function

This function will replicate table structure (but not data) from the public schema to the testing schema.

```sql
CREATE OR REPLACE FUNCTION testing.replicate_table_structure(source_schema TEXT, target_schema TEXT, table_name TEXT)
RETURNS VOID AS $$
DECLARE
  create_table_sql TEXT;
  indexes_sql TEXT;
  constraints_sql TEXT;
  triggers_sql TEXT;
BEGIN
  -- Drop table if exists in target schema
  EXECUTE format('DROP TABLE IF EXISTS %I.%I CASCADE', target_schema, table_name);
  
  -- Get CREATE TABLE statement
  SELECT pg_get_tabledef(source_schema, table_name) INTO create_table_sql;
  
  -- Modify CREATE TABLE statement to point to target schema
  create_table_sql := REPLACE(create_table_sql, source_schema || '.' || table_name, target_schema || '.' || table_name);
  
  -- Execute CREATE TABLE
  EXECUTE create_table_sql;
  
  -- Copy indexes (except those created by constraints)
  FOR indexes_sql IN 
    SELECT pg_get_indexdef(indexrelid)
    FROM pg_index
    JOIN pg_class AS i ON i.oid = indexrelid
    JOIN pg_class AS t ON t.oid = indrelid
    JOIN pg_namespace AS ns ON t.relnamespace = ns.oid
    LEFT JOIN pg_constraint AS c ON c.conindid = indexrelid
    WHERE ns.nspname = source_schema
    AND t.relname = table_name
    AND c.oid IS NULL
  LOOP
    indexes_sql := REPLACE(indexes_sql, source_schema || '.', target_schema || '.');
    BEGIN
      EXECUTE indexes_sql;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to create index: %', indexes_sql;
    END;
  END LOOP;
  
  -- Copy comments
  FOR constraints_sql IN
    SELECT format(
      'COMMENT ON COLUMN %I.%I.%I IS %L',
      target_schema,
      table_name,
      col.attname,
      pg_description.description
    )
    FROM pg_description
    JOIN pg_class AS c ON c.oid = pg_description.objoid
    JOIN pg_namespace AS ns ON c.relnamespace = ns.oid
    JOIN pg_attribute AS col ON col.attrelid = c.oid AND col.attnum = pg_description.objsubid
    WHERE ns.nspname = source_schema
    AND c.relname = table_name
    AND col.attnum > 0
  LOOP
    BEGIN
      EXECUTE constraints_sql;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to add comment: %', constraints_sql;
    END;
  END LOOP;
  
  RAISE NOTICE 'Successfully replicated table structure from %.% to %.%', source_schema, table_name, target_schema, table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION testing.replicate_table_structure IS 'Replicates table structure (not data) from source schema to target schema';
```

### 1.3 Replicate All Tables Function

This function will replicate all tables from the public schema to the testing schema.

```sql
CREATE OR REPLACE FUNCTION testing.replicate_all_tables(source_schema TEXT DEFAULT 'public', target_schema TEXT DEFAULT 'testing')
RETURNS VOID AS $$
DECLARE
  tbl_record RECORD;
BEGIN
  FOR tbl_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = source_schema
    ORDER BY tablename
  LOOP
    PERFORM testing.replicate_table_structure(source_schema, target_schema, tbl_record.tablename);
  END LOOP;
  
  RAISE NOTICE 'Successfully replicated all tables from % schema to % schema', source_schema, target_schema;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION testing.replicate_all_tables IS 'Replicates all table structures from source schema to target schema';
```

### 1.4 Clean Testing Data Function

This function will truncate all tables in the testing schema to start with a clean slate.

```sql
CREATE OR REPLACE FUNCTION testing.clean_all_data()
RETURNS VOID AS $$
DECLARE
  tbl_record RECORD;
BEGIN
  -- Disable triggers temporarily for cleaning
  SET session_replication_role = 'replica';
  
  FOR tbl_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'testing'
    ORDER BY tablename
  LOOP
    EXECUTE format('TRUNCATE TABLE testing.%I CASCADE', tbl_record.tablename);
  END LOOP;
  
  -- Re-enable triggers
  SET session_replication_role = 'origin';
  
  RAISE NOTICE 'Successfully cleaned all data from testing schema';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION testing.clean_all_data IS 'Truncates all tables in the testing schema';
```

### 1.5 Edge Function for Test Setup

To be able to call these functions from our test setup, we'll need an edge function:

```typescript
// supabase/functions/test-setup/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Parse request body
    const { action } = await req.json()

    let result
    
    // Execute the requested action
    switch (action) {
      case 'setup_schema':
        // First ensure testing schema exists
        await supabaseClient.rpc('testing.replicate_all_tables')
        result = { message: 'Schema setup complete' }
        break
      
      case 'clean_test_data':
        // Clean all testing data
        await supabaseClient.rpc('testing.clean_all_data')
        result = { message: 'Test data cleaned' }
        break
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Return success response
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    // Return error response
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### 1.6 Test setup script

Create a script to execute the schema setup before tests run:

```typescript
// tests/setup/schemaSetup.ts
import { supabase } from '@/integrations/supabase/client'

/**
 * Sets up the testing schema by calling the test-setup function
 */
export async function setupTestingSchema(): Promise<void> {
  console.log('Setting up testing schema...')
  try {
    const { data, error } = await supabase.functions.invoke('test-setup', {
      body: { action: 'setup_schema' }
    })
    
    if (error) {
      console.error('Failed to set up testing schema:', error)
      throw error
    }
    
    console.log('Testing schema setup complete:', data.message)
  } catch (err) {
    console.error('Error setting up testing schema:', err)
    throw err
  }
}

/**
 * Cleans all test data
 */
export async function cleanTestData(): Promise<void> {
  console.log('Cleaning test data...')
  try {
    const { data, error } = await supabase.functions.invoke('test-setup', {
      body: { action: 'clean_test_data' }
    })
    
    if (error) {
      console.error('Failed to clean test data:', error)
      throw error
    }
    
    console.log('Test data cleaned:', data.message)
  } catch (err) {
    console.error('Error cleaning test data:', err)
    throw err
  }
}
```

## Next Steps

After implementing and testing Step 1, we'll proceed with:

- Step 2: Enhancing the Supabase client for schema selection
- Step 3: Implementing SchemaAwareRepository
- Step 4: Updating the testing infrastructure
- Step 5: Replacing mock tests with schema tests
