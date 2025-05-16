
class TestReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
    this.testRunId = process.env.TEST_RUN_ID || null;
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      duration: 0,
      testResults: [],
      // Track which tests we've already reported to prevent double counting
      reportedTests: new Set()
    };
    
    console.log(`TestReporter initialized with TEST_RUN_ID: ${this.testRunId || 'not set'}`);
    console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL || 'not set'}`);
    console.log(`TEST_REPORTING_API_KEY: ${process.env.TEST_REPORTING_API_KEY ? '[SET]' : '[NOT SET]'}`);
  }

  async onRunStart() {
    console.log(`onRunStart called, testRunId: ${this.testRunId || 'not set'}`);
    
    // Validation of required environment variables
    if (!process.env.SUPABASE_URL) {
      console.error('SUPABASE_URL is not set. Cannot create test run.');
      return;
    }
    
    if (!process.env.TEST_REPORTING_API_KEY) {
      console.error('TEST_REPORTING_API_KEY is not set. Cannot create test run.');
      return;
    }
    
    try {
      // Initial test run creation - but only if we don't already have a test run ID
      if (!this.testRunId) {
        console.log(`Creating new test run via ${process.env.SUPABASE_URL}/functions/v1/report-test-results`);
        
        // Create a new test run in Supabase - don't send any test counts initially
        const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/report-test-results`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.TEST_REPORTING_API_KEY
          },
          body: JSON.stringify({
            status: 'in_progress',
            git_commit: process.env.GITHUB_SHA || null,
            git_branch: process.env.GITHUB_REF_NAME || null,
            // Initialize with zeros - final update will come at the end
            total_tests: 0,
            passed_tests: 0,
            failed_tests: 0,
            skipped_tests: 0,
            duration_ms: 0,
            test_results: []
          })
        });
        
        console.log(`Response status: ${response.status}`);
        
        const responseText = await response.text();
        
        try {
          // Try to parse as JSON
          const data = JSON.parse(responseText);
          
          if (response.ok) {
            this.testRunId = data.test_run_id;
            process.env.TEST_RUN_ID = this.testRunId;
            console.log(`Created test run with ID: ${this.testRunId}`);
          } else {
            console.error('Failed to create test run via edge function:', data);
          }
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', responseText);
        }
      } else {
        console.log(`Using existing test run ID: ${this.testRunId}`);
      }
    } catch (error) {
      console.error('Error in onRunStart:', error);
    }
  }

  async onTestResult(test, testResult) {
    const { testResults, testFilePath } = testResult;
    
    if (!this.testRunId) {
      console.error('No testRunId available. Cannot report test results.');
      return;
    }
    
    if (!process.env.SUPABASE_URL) {
      console.error('SUPABASE_URL is not set. Cannot report test results.');
      return;
    }
    
    if (!process.env.TEST_REPORTING_API_KEY) {
      console.error('TEST_REPORTING_API_KEY is not set. Cannot report test results.');
      return;
    }
    
    console.log(`Reporting test results for ${testFilePath} to test run ${this.testRunId}`);
    
    // Extract test suite name from file path
    const testSuitePath = testFilePath.split('/');
    const testSuiteName = testSuitePath[testSuitePath.length - 1].replace('.test.ts', '').replace('.test.tsx', '');
    
    // Collect all test results for this file first, then send as a single batch
    const batchResults = [];
    
    // Process each test
    for (const result of testResults) {
      const testStatus = result.status === 'passed' ? 'passed' : 
                        result.status === 'failed' ? 'failed' : 'skipped';
      
      // Handle different test result formats for the title
      // Some test frameworks provide title as an array, others as a string
      let testName = '';
      if (Array.isArray(result.title)) {
        testName = result.title.join(' > ');
      } else if (typeof result.title === 'string') {
        testName = result.title;
      } else if (result.fullName) {
        testName = result.fullName;
      } else {
        testName = `Test #${this.results.total}`;
      }
      
      // Create a unique identifier for this test to avoid duplicates
      const testId = `${testSuiteName}:${testName}`;
      
      // Skip if we've already reported this test
      if (this.results.reportedTests.has(testId)) {
        console.log(`Skipping duplicate test: ${testName}`);
        continue;
      }
      
      // Mark this test as reported
      this.results.reportedTests.add(testId);
      
      // Update summary counts - these will be reported in onRunComplete
      this.results.total++;
      if (testStatus === 'passed') this.results.passed++;
      else if (testStatus === 'failed') this.results.failed++;
      else this.results.skipped++;
      
      console.log(`- Test: ${testName}, Status: ${testStatus}`);
      
      // Safely handle possibly undefined properties
      const failureMessages = result.failureMessages || [];
      const consoleOutput = result.console && result.console.length > 0 
        ? result.console.map(c => `[${c.type}] ${c.message}`).join('\n') 
        : null;
      
      // Collect result details - ensure the test run ID is correctly set
      const testResult = {
        test_run_id: this.testRunId,
        test_suite: testSuiteName,
        test_name: testName,
        status: testStatus,
        duration_ms: result.duration || 0,
        error_message: failureMessages.length > 0 ? failureMessages[0] : null,
        stack_trace: failureMessages.length > 0 ? failureMessages.join('\n') : null,
        console_output: consoleOutput
      };
      
      // Add to batch
      batchResults.push(testResult);
    }
    
    // Only send the request if we have results to report
    if (batchResults.length > 0) {
      try {
        console.log(`Sending ${batchResults.length} test results to ${process.env.SUPABASE_URL}/functions/v1/report-test-results`);
        
        // Use the edge function to save test results - but DO NOT update counts here
        // The counts will be updated only in onRunComplete
        const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/report-test-results`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.TEST_REPORTING_API_KEY
          },
          body: JSON.stringify({
            test_results: batchResults,
            // Don't update the total count here, just report the individual test results
            // The final count update will happen in onRunComplete
            total_tests: 0,
            passed_tests: 0,
            failed_tests: 0,
            skipped_tests: 0,
            duration_ms: 0,
            git_commit: process.env.GITHUB_SHA || null,
            git_branch: process.env.GITHUB_REF_NAME || null
          })
        });
        
        if (!response.ok) {
          const responseText = await response.text();
          console.error(`Failed to save test results: ${responseText}`);
          console.error('Response status:', response.status);
          
          // Try to parse the error message
          try {
            const errorJson = JSON.parse(responseText);
            console.error('Error details:', JSON.stringify(errorJson, null, 2));
          } catch (e) {
            // If not JSON, just log the raw text
            console.error('Error response:', responseText);
          }
        } else {
          console.log(`Successfully reported ${batchResults.length} test results`);
        }
      } catch (error) {
        console.error(`Error saving test results:`, error);
      }
    }
    
    // Update total duration
    this.results.duration += testResult.perfStats.end - testResult.perfStats.start;
  }

  async onRunComplete(contexts, results) {
    if (!this.testRunId) {
      console.error('No testRunId available. Cannot update test run summary.');
      return;
    }
    
    console.log(`Test run complete. Updating test run ${this.testRunId} with final summary results.`);
    console.log(`Final counts: ${this.results.passed} passed, ${this.results.failed} failed, ${this.results.skipped} skipped`);
    
    try {
      // Update test run with final results using the edge function
      // This is the single source of truth for the test counts
      console.log(`Sending final update to ${process.env.SUPABASE_URL}/functions/v1/report-test-results`);
      const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/report-test-results`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.TEST_REPORTING_API_KEY
          },
          body: JSON.stringify({
            // Don't include test results in the final update, just the counts
            test_results: [],
            // Include the FINAL counts - this is the single source of truth
            total_tests: this.results.total,
            passed_tests: this.results.passed,
            failed_tests: this.results.failed,
            skipped_tests: this.results.skipped,
            duration_ms: this.results.duration,
            status: this.results.failed > 0 ? 'failure' : 'success',
            git_commit: process.env.GITHUB_SHA || null,
            git_branch: process.env.GITHUB_REF_NAME || null
          })
        });
      
      if (response.ok) {
        const responseData = await response.json();
        console.log(`Test run updated successfully with final counts. Response:`, JSON.stringify(responseData));
        console.log(`View full results at ${process.env.APP_URL || ''}/admin/tests/${this.testRunId}`);
      } else {
        const errorText = await response.text();
        console.error('Failed to update test run via edge function:', errorText);
        console.error('Response status:', response.status);
      }
    } catch (error) {
      console.error('Error updating test run:', error);
    }
  }
}

module.exports = TestReporter;
