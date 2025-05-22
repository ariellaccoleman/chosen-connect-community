
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
  git_commit?: string
  git_branch?: string
}

interface TestSuiteRequest {
  test_run_id: string
  suite_name: string
  file_path: string
  status: 'success' | 'failure' | 'skipped'
  test_count: number
  duration_ms: number
  error_message?: string
}

interface TestResultRequest {
  test_run_id: string
  test_suite_id?: string
  test_suite: string
  test_name: string
  status: 'passed' | 'failed' | 'skipped'
  duration_ms: number
  error_message?: string
  stack_trace?: string
  console_output?: string
}

interface TestRunUpdateRequest {
  test_run_id: string
  total_tests: number
  passed_tests: number
  failed_tests: number
  skipped_tests: number
  duration_ms: number
  status: 'success' | 'failure' | 'in_progress'
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
      hint: 'The provided x-api-key header does not match the expected TEST_REPORTING_API_KEY value.'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Parse the URL to determine which action to take
    const url = new URL(req.url)
    const pathname = url.pathname || ''
    const pathParts = pathname.split('/')
    const action = pathParts && pathParts.length > 0 ? pathParts[pathParts.length - 1] : ''
    
    console.log(`[report-test-results] Parsed action from URL: ${action}`)
    
    // Parse the request body
    let requestData
    try {
      requestData = await req.json()
    } catch (error) {
      console.error('[report-test-results] Error parsing request body:', error)
      return new Response(JSON.stringify({ 
        error: 'Bad Request', 
        message: 'Failed to parse request body as JSON',
        details: error.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    if (action === 'create-run') {
      // Create a new test run
      return await handleCreateTestRun(requestData, corsHeaders)
    } else if (action === 'record-suite') {
      // Record a test suite
      return await handleRecordTestSuite(requestData, corsHeaders)
    } else if (action === 'record-result') {
      // Record a test result for an existing test run
      return await handleRecordTestResult(requestData, corsHeaders)
    } else if (action === 'update-run') {
      // Update an existing test run with final results
      return await handleUpdateTestRun(requestData, corsHeaders)
    } else {
      // Default/legacy handler for backward compatibility
      console.log('[report-test-results] No specific action specified, using legacy handler')
      return new Response(JSON.stringify({ 
        error: 'Invalid endpoint', 
        message: 'Please use one of the specific endpoints: create-run, record-suite, record-result, or update-run'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (error) {
    console.error('[report-test-results] Error processing request:', error)
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

/**
 * Creates a new test run
 */
async function handleCreateTestRun(
  requestData: TestRunRequest,
  corsHeaders: Record<string, string>
): Promise<Response> {
  console.log('[create-run] Creating new test run')
  
  try {
    // Extract git info from request
    const gitCommit = requestData.git_commit || null
    const gitBranch = requestData.git_branch || null

    // Create a new test run record
    const { data, error } = await supabase
      .from('test_runs')
      .insert({
        status: 'in_progress',
        git_commit: gitCommit,
        git_branch: gitBranch,
        total_tests: 0,
        passed_tests: 0,
        failed_tests: 0,
        skipped_tests: 0,
        duration_ms: 0
      })
      .select('id')
      .single()

    if (error) {
      console.error('[create-run] Error creating test run:', error)
      
      // Generate a new UUID if there was an error with the one provided
      const newId = crypto.randomUUID()
      console.log(`[create-run] Retrying with new UUID: ${newId}`)
      
      const { data: retryData, error: retryError } = await supabase
        .from('test_runs')
        .insert({
          id: newId,
          status: 'in_progress',
          git_commit: gitCommit,
          git_branch: gitBranch,
          total_tests: 0,
          passed_tests: 0,
          failed_tests: 0,
          skipped_tests: 0,
          duration_ms: 0
        })
        .select('id')
        .single()
        
      if (retryError) {
        console.error('[create-run] Error creating test run on retry:', retryError)
        return new Response(JSON.stringify({ error: 'Failed to create test run', details: retryError }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      console.log(`[create-run] Successfully created test run with ID: ${retryData.id}`)
      return new Response(JSON.stringify({ 
        message: 'Test run created successfully',
        test_run_id: retryData.id
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    console.log(`[create-run] Successfully created test run with ID: ${data.id}`)
    return new Response(JSON.stringify({ 
      message: 'Test run created successfully',
      test_run_id: data.id
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[create-run] Exception creating test run:', error)
    return new Response(JSON.stringify({ error: 'Failed to create test run', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Records a test suite for an existing test run
 */
async function handleRecordTestSuite(
  requestData: TestSuiteRequest,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { test_run_id: testRunId } = requestData

  if (!testRunId) {
    return new Response(JSON.stringify({ 
      error: 'Missing test run ID', 
      message: 'A valid test_run_id is required'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  console.log(`[record-suite] Recording test suite for test run: ${testRunId}`)
  
  try {
    // Verify the test run exists
    const { data: testRun, error: checkError } = await supabase
      .from('test_runs')
      .select('id')
      .eq('id', testRunId)
      .maybeSingle()
    
    if (checkError || !testRun) {
      console.error('[record-suite] Test run not found:', checkError || 'No test run with that ID')
      return new Response(JSON.stringify({ 
        error: 'Test run not found', 
        message: `No test run found with ID: ${testRunId}`
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Insert the test suite
    const { data, error: insertError } = await supabase
      .from('test_suites')
      .insert({
        test_run_id: testRunId,
        suite_name: requestData.suite_name,
        file_path: requestData.file_path,
        status: requestData.status,
        test_count: requestData.test_count,
        duration_ms: requestData.duration_ms,
        error_message: requestData.error_message || null,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[record-suite] Error inserting test suite:', insertError)
      return new Response(JSON.stringify({ 
        error: 'Failed to record test suite', 
        details: insertError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[record-suite] Successfully recorded test suite ${requestData.suite_name} with ID ${data.id}`)
    return new Response(JSON.stringify({ 
      message: 'Test suite recorded successfully',
      test_suite_id: data.id
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[record-suite] Exception recording test suite:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to record test suite', 
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Records a test result for an existing test run
 */
async function handleRecordTestResult(
  requestData: TestResultRequest,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { test_run_id: testRunId } = requestData

  if (!testRunId) {
    return new Response(JSON.stringify({ 
      error: 'Missing test run ID', 
      message: 'A valid test_run_id is required'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  console.log(`[record-result] Recording test result for test run: ${testRunId}`)
  
  try {
    // Verify the test run exists
    const { data: testRun, error: checkError } = await supabase
      .from('test_runs')
      .select('id')
      .eq('id', testRunId)
      .maybeSingle()
    
    if (checkError || !testRun) {
      console.error('[record-result] Test run not found:', checkError || 'No test run with that ID')
      return new Response(JSON.stringify({ 
        error: 'Test run not found', 
        message: `No test run found with ID: ${testRunId}`
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Insert the test result
    const { error: insertError } = await supabase
      .from('test_results')
      .insert({
        test_run_id: testRunId,
        test_suite_id: requestData.test_suite_id || null,
        test_suite: requestData.test_suite,
        test_name: requestData.test_name,
        status: requestData.status,
        duration_ms: requestData.duration_ms,
        error_message: requestData.error_message || null,
        stack_trace: requestData.stack_trace || null,
        console_output: requestData.console_output || null,
      })

    if (insertError) {
      console.error('[record-result] Error inserting test result:', insertError)
      return new Response(JSON.stringify({ 
        error: 'Failed to record test result', 
        details: insertError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[record-result] Successfully recorded test result for ${requestData.test_name} in suite ${requestData.test_suite}`)
    return new Response(JSON.stringify({ 
      message: 'Test result recorded successfully',
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[record-result] Exception recording test result:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to record test result', 
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Updates an existing test run with final results
 */
async function handleUpdateTestRun(
  requestData: TestRunUpdateRequest,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { test_run_id: testRunId } = requestData

  if (!testRunId) {
    return new Response(JSON.stringify({ 
      error: 'Missing test run ID', 
      message: 'A valid test_run_id is required'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  console.log(`[update-run] Updating test run: ${testRunId} with final results`)
  console.log(`[update-run] Passed: ${requestData.passed_tests}, Failed: ${requestData.failed_tests}, Skipped: ${requestData.skipped_tests}, Total: ${requestData.total_tests}`)
  
  try {
    // Verify the test run exists
    const { data: testRun, error: checkError } = await supabase
      .from('test_runs')
      .select('id')
      .eq('id', testRunId)
      .maybeSingle()
    
    if (checkError || !testRun) {
      console.error('[update-run] Test run not found:', checkError || 'No test run with that ID')
      return new Response(JSON.stringify({ 
        error: 'Test run not found', 
        message: `No test run found with ID: ${testRunId}`
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update the test run with final results
    const { error: updateError } = await supabase
      .from('test_runs')
      .update({
        total_tests: requestData.total_tests,
        passed_tests: requestData.passed_tests,
        failed_tests: requestData.failed_tests,
        skipped_tests: requestData.skipped_tests,
        duration_ms: requestData.duration_ms,
        status: requestData.status
      })
      .eq('id', testRunId)

    if (updateError) {
      console.error('[update-run] Error updating test run:', updateError)
      return new Response(JSON.stringify({ 
        error: 'Failed to update test run', 
        details: updateError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[update-run] Successfully updated test run ${testRunId} with final results`)
    return new Response(JSON.stringify({ 
      message: 'Test run updated successfully',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[update-run] Exception updating test run:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to update test run', 
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}
