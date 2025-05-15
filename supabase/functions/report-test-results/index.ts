
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1'

// Create a Supabase client with the service role key
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseKey)

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
}

serve(async (req) => {
  // Check if the request is a POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Extract API key from request headers
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey || apiKey !== Deno.env.get('TEST_REPORTING_API_KEY')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // Parse the request body
    const requestData: TestRunRequest = await req.json()

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
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const testRunId = testRunData.id

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

      const { error: resultsError } = await supabase
        .from('test_results')
        .insert(testResults)

      if (resultsError) {
        console.error('Error inserting test results:', resultsError)
        return new Response(JSON.stringify({ 
          message: 'Test run created but failed to insert all test results',
          test_run_id: testRunId 
        }), {
          status: 207,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Test run and results created successfully',
      test_run_id: testRunId 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
