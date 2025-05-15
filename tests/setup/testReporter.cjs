
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
      testResults: []
    };
    
    console.log(`TestReporter initialized with TEST_RUN_ID: ${this.testRunId || 'not set'}`);
    console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL || 'not set'}`);
    console.log(`TEST_REPORTING_API_KEY: ${process.env.TEST_REPORTING_API_KEY ? '[SET]' : '[NOT SET]'}`);
  }

  async onRunStart() {
    console.log(`onRunStart called, testRunId: ${this.testRunId || 'not set'}`);
    
    if (!process.env.SUPABASE_URL) {
      console.error('SUPABASE_URL is not set. Cannot create test run.');
      return;
    }
    
    if (!process.env.TEST_REPORTING_API_KEY) {
      console.error('TEST_REPORTING_API_KEY is not set. Cannot create test run.');
      return;
    }
    
    if (!this.testRunId) {
      try {
        console.log(`Creating new test run via ${process.env.SUPABASE_URL}/functions/v1/report-test-results`);
        
        // Create a new test run in Supabase
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
            total_tests: 0,
            passed_tests: 0,
            failed_tests: 0,
            skipped_tests: 0,
            duration_ms: 0,
            test_results: []
          })
        });
        
        console.log(`Response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          this.testRunId = data.test_run_id;
          process.env.TEST_RUN_ID = this.testRunId;
          console.log(`Created test run with ID: ${this.testRunId}`);
        } else {
          const errorText = await response.text();
          console.error('Failed to create test run via edge function:', errorText);
        }
      } catch (error) {
        console.error('Error creating test run:', error);
      }
      
      if (!this.testRunId) {
        console.error('Failed to create test run. Tests will not be properly reported.');
      }
    }
  }

  async onTestResult(test, testResult) {
    const { testResults, testFilePath } = testResult;
    
    if (!this.testRunId) {
      console.error('No testRunId available. Cannot report test results.');
      return;
    }
    
    console.log(`Reporting test results for ${testFilePath} to test run ${this.testRunId}`);
    
    // Extract test suite name from file path
    const testSuitePath = testFilePath.split('/');
    const testSuiteName = testSuitePath[testSuitePath.length - 1].replace('.test.ts', '').replace('.test.tsx', '');
    
    // Process each test
    for (const result of testResults) {
      const testStatus = result.status === 'passed' ? 'passed' : 
                        result.status === 'failed' ? 'failed' : 'skipped';
      
      // Update summary counts
      this.results.total++;
      if (testStatus === 'passed') this.results.passed++;
      else if (testStatus === 'failed') this.results.failed++;
      else this.results.skipped++;
      
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
      
      console.log(`- Test: ${testName}, Status: ${testStatus}`);
      
      // Safely handle possibly undefined properties
      const failureMessages = result.failureMessages || [];
      const consoleOutput = result.console && result.console.length > 0 
        ? result.console.map(c => `[${c.type}] ${c.message}`).join('\n') 
        : null;
      
      // Collect result details
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
      
      this.results.testResults.push(testResult);
      
      try {
        console.log(`Sending test result to ${process.env.SUPABASE_URL}/functions/v1/report-test-results`);
        // Use the edge function to save test results
        const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/report-test-results`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.TEST_REPORTING_API_KEY
          },
          body: JSON.stringify({
            total_tests: 1,
            passed_tests: testStatus === 'passed' ? 1 : 0,
            failed_tests: testStatus === 'failed' ? 1 : 0,
            skipped_tests: testStatus === 'skipped' ? 1 : 0,
            duration_ms: result.duration || 0,
            git_commit: process.env.GITHUB_SHA || null,
            git_branch: process.env.GITHUB_REF_NAME || null,
            test_results: [testResult]
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to save test result for ${testName}: ${errorText}`);
        } else {
          console.log(`Successfully reported test result for ${testName}`);
        }
      } catch (error) {
        console.error(`Error saving test result for ${testName}:`, error);
      }
    }
    
    // Update total duration
    this.results.duration += testResult.perfStats.end - testResult.perfStats.start;
  }

  async onRunComplete(contexts, results) {
    console.log(`Test run complete. Updating test run ${this.testRunId} with summary results.`);
    console.log(`Summary: ${this.results.passed} passed, ${this.results.failed} failed, ${this.results.skipped} skipped`);
    
    if (this.testRunId) {
      try {
        // Update test run with final results using the edge function
        console.log(`Sending final update to ${process.env.SUPABASE_URL}/functions/v1/report-test-results`);
        const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/report-test-results`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.TEST_REPORTING_API_KEY
          },
          body: JSON.stringify({
            total_tests: this.results.total,
            passed_tests: this.results.passed,
            failed_tests: this.results.failed,
            skipped_tests: this.results.skipped,
            duration_ms: this.results.duration,
            git_commit: process.env.GITHUB_SHA || null,
            git_branch: process.env.GITHUB_REF_NAME || null,
            test_results: [] // Don't send results again, just update the summary
          })
        });
        
        if (response.ok) {
          console.log(`Test run updated successfully: ${this.results.passed} passed, ${this.results.failed} failed, ${this.results.skipped} skipped`);
          console.log(`View full results at ${process.env.APP_URL || ''}/admin/tests/${this.testRunId}`);
        } else {
          const errorText = await response.text();
          console.error('Failed to update test run via edge function:', errorText);
        }
      } catch (error) {
        console.error('Error updating test run:', error);
      }
    } else {
      console.error('No testRunId available. Cannot update test run summary.');
    }
  }
}

module.exports = TestReporter;
