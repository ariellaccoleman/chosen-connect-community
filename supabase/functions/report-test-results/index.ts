
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
  total_tests: number
  passed_tests: number
  failed_tests: number
  skipped_tests: number
  duration_ms: number
  git_commit?: string
  git_branch?: string
  test_results: TestResultRequest[]
}

interface TestResultRequest {
  test_suite: string
  test_name: string
  status: 'passed' | 'failed' | 'skipped'
  duration_ms: number
  error_message?: string
  stack_trace?: string
  console_output?: string
  test_run_id?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  // Check if the request is a POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Extract API key from request headers
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey || apiKey !== Deno.env.get('TEST_REPORTING_API_KEY')) {
    return new Response(JSON.stringify({ 
      error: 'Unauthorized', 
      message: 'No API key found in request',
      hint: 'No `x-api-key` request header was found or it was invalid.'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Parse the request body
    const requestData: TestRunRequest = await req.json()
    
    // If we have a test_run_id in the first test result, this is an update to an existing test run
    const existingTestRunId = requestData.test_results.length > 0 ? 
      requestData.test_results[0]?.test_run_id : null;
    
    let testRunId: string;
    
    if (existingTestRunId) {
      // Update the existing test run
      testRunId = existingTestRunId;
      
      // Update the test run with new counts (add to existing)
      const { data: currentRun, error: fetchError } = await supabase
        .from('test_runs')
        .select('total_tests, passed_tests, failed_tests, skipped_tests')
        .eq('id', testRunId)
        .single();
      
      if (fetchError) {
        return new Response(JSON.stringify({ error: 'Failed to fetch current test run' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      const newTotalTests = (currentRun.total_tests || 0) + requestData.total_tests;
      const newPassedTests = (currentRun.passed_tests || 0) + requestData.passed_tests;
      const newFailedTests = (currentRun.failed_tests || 0) + requestData.failed_tests;
      const newSkippedTests = (currentRun.skipped_tests || 0) + requestData.skipped_tests;
      
      const { error: updateError } = await supabase
        .from('test_runs')
        .update({
          total_tests: newTotalTests,
          passed_tests: newPassedTests,
          failed_tests: newFailedTests,
          skipped_tests: newSkippedTests,
          duration_ms: requestData.duration_ms > 0 ? requestData.duration_ms : undefined,
          status: newFailedTests > 0 ? 'failure' : 'success',
        })
        .eq('id', testRunId);
      
      if (updateError) {
        return new Response(JSON.stringify({ error: 'Failed to update test run' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else {
      // Create a new test run
      const { data: testRunData, error: testRunError } = await supabase
        .from('test_runs')
        .insert({
          total_tests: requestData.total_tests,
          passed_tests: requestData.passed_tests,
          failed_tests: requestData.failed_tests,
          skipped_tests: requestData.skipped_tests,
          duration_ms: requestData.duration_ms,
          git_commit: requestData.git_commit,
          git_branch: requestData.git_branch,
          status: requestData.failed_tests > 0 ? 'failure' : 'success',
        })
        .select('id')
        .single()

      if (testRunError) {
        console.error('Error creating test run:', testRunError)
        return new Response(JSON.stringify({ error: 'Failed to create test run' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      testRunId = testRunData.id
    }

    // Process test results
    if (requestData.test_results && requestData.test_results.length > 0) {
      const testResults = requestData.test_results.map(result => ({
        test_run_id: testRunId,
        test_suite: result.test_suite,
        test_name: result.test_name,
        status: result.status,
        duration_ms: result.duration_ms,
        error_message: result.error_message || null,
        stack_trace: result.stack_trace || null,
        console_output: result.console_output || null,
      }))

      // Insert test results in batches if there are many
      const batchSize = 20;
      for (let i = 0; i < testResults.length; i += batchSize) {
        const batch = testResults.slice(i, i + batchSize);
        const { error: resultsError } = await supabase
          .from('test_results')
          .insert(batch);

        if (resultsError) {
          console.error('Error inserting test results batch:', resultsError)
          // Continue with the next batch, don't exit completely
        }
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
    console.error('Error processing request:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
