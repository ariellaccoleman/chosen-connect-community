
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
    const { action, tableName, columns } = await req.json()

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
      
      case 'create_test_table':
        // Create a test table in the testing schema
        if (!tableName) {
          return new Response(
            JSON.stringify({ error: 'Table name is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // Generate SQL to create the table
        let createTableSql = `CREATE TABLE IF NOT EXISTS testing.${tableName} (`
        
        if (columns && columns.length > 0) {
          const columnDefs = columns.map(col => {
            let def = `${col.name} ${col.type}`
            if (col.isRequired) def += ' NOT NULL'
            if (col.isPrimary) def += ' PRIMARY KEY'
            if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`
            return def
          })
          
          createTableSql += columnDefs.join(', ')
        } else {
          // Default columns if none provided
          createTableSql += `
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          `
        }
        
        createTableSql += ');'
        
        // Execute the SQL
        console.log('Creating test table with SQL:', createTableSql)
        
        const { error } = await supabaseClient.rpc('exec_sql', {
          query: createTableSql
        })
        
        if (error) {
          return new Response(
            JSON.stringify({ error: `Failed to create test table: ${error.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        result = { message: `Test table '${tableName}' created successfully` }
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
