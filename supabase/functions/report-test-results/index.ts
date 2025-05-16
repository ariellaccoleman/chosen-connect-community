import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1'

// Create a Supabase client with the service role key
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Set up CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface TestRunRequest {
  test_run_id?: string
  total_tests?: number
  passed_tests?: number
  failed_tests?: number
  skipped_tests?: number
  duration_ms?: number
  git_commit?: string
  git_branch?: string
  test_results?: TestResultRequest[]
  status?: string
  create_test_run?: boolean
}

interface TestResultRequest {
  test_run_id?: string
  test_suite: string
  test_name: string
  status: 'passed' | 'failed' | 'skipped'
  duration_ms: number
  error_message?: string
  stack_trace?: string
  console_output?: string
}

serve(async (req) => {
  console.log(`[report-test-results] Received ${req.method} request`)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[report-test-results] Handling CORS preflight request')
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  // Check if the request is a POST
  if (req.method !== 'POST') {
    console.log(`[report-test-results] Method not allowed: ${req.method}`)
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Extract API key from request headers
  const apiKey = req.headers.get('x-api-key')
  const expectedApiKey = Deno.env.get('TEST_REPORTING_API_KEY')

  // Debug logging for API key validation
  console.log(`[report-test-results] API key validation:`)
  console.log(`- Expected key ${expectedApiKey ? 'is set' : 'is not set'}`)
  console.log(`- Provided key ${apiKey ? 'is provided' : 'is not provided'}`)
  console.log(`- Keys match: ${apiKey === expectedApiKey}`)

  if (!apiKey || apiKey !== expectedApiKey) {
    console.error('[report-test-results] Unauthorized: Invalid API key')
    return new Response(JSON.stringify({ 
      error: 'Unauthorized', 
      message: 'Invalid API key',
      hint: 'The provided x-api-key header does not match the expected TEST_REPORTING_API_KEY value.',
      debug: {
        keyProvided: !!apiKey,
        keyExpectedSet: !!expectedApiKey,
        keyLength: apiKey ? apiKey.length : 0,
        expectedKeyLength: expectedApiKey ? expectedApiKey.length : 0
      }
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const requestData: TestRunRequest = await req.json()
    console.log(`[report-test-results] Processing request`)
    
    let testRunId = requestData.test_run_id
    
    // Handle test run creation - this should only happen when explicitly requested
    if (requestData.create_test_run === true) {
      // Creating a new test run - this should be called once at the start of testing
      const { data: newRun, error: createError } = await supabase
        .from('test_runs')
        .insert({
          status: 'in_progress',
          total_tests: 0,
          passed_tests: 0,
          failed_tests: 0,
          skipped_tests: 0,
          duration_ms: 0,
          git_commit: requestData.git_commit,
          git_branch: requestData.git_branch,
        })
        .select('id')
        .single()

      if (createError) {
        throw new Error(`Failed to create test run: ${createError.message}`)
      }
      
      testRunId = newRun.id
      console.log(`[report-test-results] Created new test run: ${testRunId}`)
      
      return new Response(JSON.stringify({ 
        message: 'Test run created successfully',
        test_run_id: testRunId 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // For all other operations, test_run_id is required
    if (!testRunId) {
      return new Response(JSON.stringify({ 
        error: 'Bad Request',
        message: 'test_run_id is required for reporting test results and updates'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Handle test results if present - just insert them, don't update counts
    if (requestData.test_results?.length) {
      console.log(`[report-test-results] Processing ${requestData.test_results.length} test results`)
      
      const testResults = requestData.test_results.map(result => ({
        ...result,
        test_run_id: testRunId
      }))

      const { error: resultsError } = await supabase
        .from('test_results')
        .insert(testResults)

      if (resultsError) {
        throw new Error(`Failed to insert test results: ${resultsError.message}`)
      }
    }

    // Only update test run counts when final summary data is provided
    if (requestData.total_tests !== undefined &&
        requestData.passed_tests !== undefined &&
        requestData.failed_tests !== undefined &&
        requestData.skipped_tests !== undefined) {
      console.log(`[report-test-results] Updating test run ${testRunId} with final summary data`)
      
      const { error: updateError } = await supabase
        .from('test_runs')
        .update({
          total_tests: requestData.total_tests,
          passed_tests: requestData.passed_tests,
          failed_tests: requestData.failed_tests,
          skipped_tests: requestData.skipped_tests,
          duration_ms: requestData.duration_ms || 0,
          status: requestData.failed_tests > 0 ? 'failure' : 'success'
        })
        .eq('id', testRunId)

      if (updateError) {
        throw new Error(`Failed to update test run: ${updateError.message}`)
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Test run and results processed successfully',
      test_run_id: testRunId 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[report-test-results] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
