
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
    // Parse the request body
    const requestData: TestRunRequest = await req.json()
    console.log(`[report-test-results] Processing request with ${requestData.test_results.length} test results`)
    
    // If we have a test_run_id in the first test result, this is an update to an existing test run
    const existingTestRunId = requestData.test_results.length > 0 ? 
      requestData.test_results[0]?.test_run_id : null;
    
    let testRunId: string;
    
    if (existingTestRunId) {
      // Update the existing test run
      testRunId = existingTestRunId;
      console.log(`[report-test-results] Checking for existing test run: ${testRunId}`)
      
      const { data: currentRun, error: fetchError } = await supabase
        .from('test_runs')
        .select('total_tests, passed_tests, failed_tests, skipped_tests')
        .eq('id', testRunId)
        .maybeSingle();
      
      if (fetchError) {
        console.error('[report-test-results] Error fetching current test run:', fetchError);
        
        // Check if test run exists before trying to create a new one
        const { count, error: countError } = await supabase
          .from('test_runs')
          .select('*', { count: 'exact', head: true })
          .eq('id', testRunId);
          
        if (countError) {
          console.error('[report-test-results] Error checking if test run exists:', countError);
        }
        
        // Only create a new run if it doesn't exist
        if (count === 0) {
          console.log('[report-test-results] Creating new test run with the provided ID due to fetch error');
          const { error: insertError } = await supabase
            .from('test_runs')
            .insert({
              id: testRunId,
              total_tests: requestData.total_tests,
              passed_tests: requestData.passed_tests,
              failed_tests: requestData.failed_tests,
              skipped_tests: requestData.skipped_tests,
              duration_ms: requestData.duration_ms > 0 ? requestData.duration_ms : undefined,
              git_commit: requestData.git_commit,
              git_branch: requestData.git_branch,
              status: requestData.failed_tests > 0 ? 'failure' : 'success',
            });

          if (insertError) {
            console.error('[report-test-results] Error creating new test run with specified ID:', insertError);
            return new Response(JSON.stringify({ error: 'Failed to create test run', details: insertError }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          console.log(`[report-test-results] Successfully created test run with specified ID: ${testRunId}`);
        } else {
          // Test run exists, try to update it
          console.log('[report-test-results] Test run exists despite fetch error, attempting update');
          const { error: updateError } = await supabase
            .from('test_runs')
            .update({
              total_tests: requestData.total_tests,
              passed_tests: requestData.passed_tests,
              failed_tests: requestData.failed_tests,
              skipped_tests: requestData.skipped_tests,
              duration_ms: requestData.duration_ms > 0 ? requestData.duration_ms : undefined,
              status: requestData.failed_tests > 0 ? 'failure' : 'success',
            })
            .eq('id', testRunId);
            
          if (updateError) {
            console.error('[report-test-results] Error updating test run after fetch error:', updateError);
          } else {
            console.log(`[report-test-results] Successfully updated test run: ${testRunId}`);
          }
        }
      } else if (!currentRun) {
        // If no current run was found with that ID, create a new one with that ID
        console.log('[report-test-results] No existing test run found, creating new one with provided ID');
        const { error: createError } = await supabase
          .from('test_runs')
          .insert({
            id: testRunId, // Use the provided ID
            total_tests: requestData.total_tests,
            passed_tests: requestData.passed_tests,
            failed_tests: requestData.failed_tests,
            skipped_tests: requestData.skipped_tests,
            duration_ms: requestData.duration_ms > 0 ? requestData.duration_ms : undefined,
            git_commit: requestData.git_commit,
            git_branch: requestData.git_branch,
            status: requestData.failed_tests > 0 ? 'failure' : 'success',
          });

        if (createError) {
          console.error('[report-test-results] Error creating test run with provided ID:', createError);
          return new Response(JSON.stringify({ error: 'Failed to create test run', details: createError }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        console.log(`[report-test-results] New test run created with provided ID: ${testRunId}`);
      } else {
        // Update the existing test run with new counts
        console.log(`[report-test-results] Updating existing test run: ${testRunId}`);
        
        // Use the values from the request for the final update
        const newTotalTests = requestData.total_tests > 0 ? requestData.total_tests : (currentRun.total_tests || 0);
        const newPassedTests = requestData.passed_tests > 0 ? requestData.passed_tests : (currentRun.passed_tests || 0);
        const newFailedTests = requestData.failed_tests > 0 ? requestData.failed_tests : (currentRun.failed_tests || 0);
        const newSkippedTests = requestData.skipped_tests > 0 ? requestData.skipped_tests : (currentRun.skipped_tests || 0);
        
        console.log(`[report-test-results] Updated counts: ${newPassedTests} passed, ${newFailedTests} failed, ${newSkippedTests} skipped, total: ${newTotalTests}`);
        
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
          console.error('[report-test-results] Error updating test run:', updateError);
          return new Response(JSON.stringify({ error: 'Failed to update test run', details: updateError }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    } else {
      // Create a new test run
      console.log('[report-test-results] Creating new test run');
      
      // Check if this is the final update with actual test counts
      const isFinalUpdate = 
        requestData.total_tests > 0 || 
        requestData.passed_tests > 0 || 
        requestData.failed_tests > 0 || 
        requestData.skipped_tests > 0;
      
      // FIX: Use insert instead of upsert - avoid potential duplicate creation
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
        .single();

      if (testRunError) {
        console.error('[report-test-results] Error creating test run:', testRunError);
        
        // FIX: Generate a new UUID and try again if there was an error
        const newId = crypto.randomUUID();
        console.log(`[report-test-results] Retrying with new UUID: ${newId}`);
        
        const { data: retryData, error: retryError } = await supabase
          .from('test_runs')
          .insert({
            id: newId,
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
          .single();
          
        if (retryError) {
          console.error('[report-test-results] Error creating test run on retry:', retryError);
          return new Response(JSON.stringify({ error: 'Failed to create test run', details: retryError }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        testRunId = retryData.id;
        console.log(`[report-test-results] Successfully created test run on retry with ID: ${testRunId}`);
      } else {
        testRunId = testRunData.id;
        console.log(`[report-test-results] New test run created with ID: ${testRunId}`);
      }
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
      }));

      console.log(`[report-test-results] Processing ${testResults.length} test results for run ${testRunId}`);

      // Insert test results in batches if there are many
      const batchSize = 20;
      for (let i = 0; i < testResults.length; i += batchSize) {
        const batch = testResults.slice(i, i + batchSize);
        const { error: resultsError } = await supabase
          .from('test_results')
          .insert(batch);

        if (resultsError) {
          console.error('[report-test-results] Error inserting test results batch:', resultsError);
          // Continue with the next batch, don't exit completely
        } else {
          console.log(`[report-test-results] Successfully inserted batch of ${batch.length} test results`);
        }
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Test run and results processed successfully',
      test_run_id: testRunId 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[report-test-results] Error processing request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})
