
// This file will be deployed as an Edge Function in Supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Create Supabase client with service role key (needed for admin operations)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    
    // Parse JSON body
    const { action, sourceSchema = 'public', targetSchema, upsertFunction = false } = await req.json();
    
    if (!targetSchema) {
      return new Response(
        JSON.stringify({ error: "Target schema name is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    let result;
    
    switch (action) {
      case 'create_schema':
        // Create the schema if it doesn't exist
        result = await supabase.rpc('exec_sql', { 
          query: `CREATE SCHEMA IF NOT EXISTS ${targetSchema}` 
        });
        break;
        
      case 'drop_schema':
        // Drop the schema
        result = await supabase.rpc('exec_sql', { 
          query: `DROP SCHEMA IF EXISTS ${targetSchema} CASCADE` 
        });
        break;
        
      case 'replicate_schema':
        // First create the schema
        await supabase.rpc('exec_sql', { 
          query: `CREATE SCHEMA IF NOT EXISTS ${targetSchema}` 
        });
        
        // Get list of tables from source schema
        const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
          query: `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = '${sourceSchema}' 
            AND table_type = 'BASE TABLE'
          `
        });
        
        if (tablesError) {
          throw tablesError;
        }
        
        // For each table, get its definition and create in target schema
        const replicationResults = [];
        for (const tableRow of tables || []) {
          const tableName = tableRow.table_name;
          
          // Get table definition
          const { data: tableDef, error: defError } = await supabase.rpc('pg_get_tabledef', {
            p_schema: sourceSchema,
            p_table: tableName
          });
          
          if (defError) {
            replicationResults.push({
              table: tableName,
              success: false,
              error: defError
            });
            continue;
          }
          
          // Replace schema name in the definition
          const targetTableDef = tableDef.replace(
            new RegExp(`${sourceSchema}\\.`, 'g'), 
            `${targetSchema}.`
          );
          
          // Create table in target schema
          const { error: createError } = await supabase.rpc('exec_sql', { 
            query: targetTableDef 
          });
          
          replicationResults.push({
            table: tableName,
            success: !createError,
            error: createError
          });
        }
        
        // Create the testing schema replication function if requested
        if (upsertFunction) {
          const funcResult = await supabase.rpc('exec_sql', {
            query: `
              CREATE OR REPLACE FUNCTION ${targetSchema}.replicate_all_tables(source_schema TEXT, target_schema TEXT)
              RETURNS void AS $$
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
                      -- Get the table definition (using the function we created earlier)
                      SELECT public.pg_get_tabledef(source_schema, table_record.table_name) INTO table_def;
                      
                      -- Replace schema name in the definition
                      table_def := REPLACE(table_def, source_schema || '.', target_schema || '.');
                      
                      -- Create the table in the target schema
                      EXECUTE table_def;
                  END LOOP;
              END;
              $$ LANGUAGE plpgsql;
            `
          });
        }
        
        result = { tables: replicationResults };
        break;
        
      case 'add_test_users_table':
        // Create a test users table that mirrors auth.users
        result = await supabase.rpc('exec_sql', {
          query: `
            CREATE TABLE IF NOT EXISTS ${targetSchema}.users (
              id UUID PRIMARY KEY,
              email TEXT UNIQUE,
              raw_user_meta_data JSONB,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            )
          `
        });
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }
    
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
