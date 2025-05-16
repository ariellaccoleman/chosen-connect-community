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
    
    if (!process.env.SUPABASE_URL || !process.env.TEST_REPORTING_API_KEY) {
      console.error('Missing required environment variables. Cannot create test run.');
      return;
    }
    
    try {
      if (!this.testRunId) {
        console.log(`Creating new test run via ${process.env.SUPABASE_URL}/functions/v1/report-test-results`);
        
        const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/report-test-results`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.TEST_REPORTING_API_KEY
          },
          body: JSON.stringify({
            status: 'in_progress',
            total_tests: 0,
            passed_tests: 0,
            failed_tests: 0,
            skipped_tests: 0,
            duration_ms: 0,
            git_commit: process.env.GITHUB_SHA || null,
            git_branch: process.env.GITHUB_REF_NAME || null
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          this.testRunId = data.test_run_id;
          process.env.TEST_RUN_ID = this.testRunId;
          console.log(`Created test run with ID: ${this.testRunId}`);
        } else {
          const errorText = await response.text();
          console.error('Failed to create test run:', errorText);
        }
      }
    } catch (error) {
      console.error('Error in onRunStart:', error);
    }
  }

  async onTestResult(test, testResult) {
    const { testResults, testFilePath } = testResult;
    
    if (!this.testRunId || !process.env.SUPABASE_URL || !process.env.TEST_REPORTING_API_KEY) {
      console.error('Missing required configuration. Cannot report test results.');
      return;
    }
    
    console.log(`Reporting test results for ${testFilePath} to test run ${this.testRunId}`);
    
    const testSuitePath = testFilePath.split('/');
    const testSuiteName = testSuitePath[testSuitePath.length - 1].replace('.test.ts', '').replace('.test.tsx', '');
    
    for (const result of testResults) {
      const testStatus = result.status === 'passed' ? 'passed' : 
                        result.status === 'failed' ? 'failed' : 'skipped';
      
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
      
      const testId = `${testSuiteName}:${testName}`;
      
      if (this.results.reportedTests.has(testId)) {
        console.log(`Skipping duplicate test: ${testName}`);
        continue;
      }
      
      this.results.reportedTests.add(testId);
      
      // Update our local counts but don't send them yet
      this.results.total++;
      if (testStatus === 'passed') this.results.passed++;
      else if (testStatus === 'failed') this.results.failed++;
      else this.results.skipped++;
      
      console.log(`- Test: ${testName}, Status: ${testStatus}`);
      
      const failureMessages = result.failureMessages || [];
      const consoleOutput = result.console && result.console.length > 0 
        ? result.console.map(c => `[${c.type}] ${c.message}`).join('\n') 
        : null;
      
      try {
        // Send only the test result without counts
        const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/report-test-results`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.TEST_REPORTING_API_KEY
          },
          body: JSON.stringify({
            test_run_id: this.testRunId,
            test_results: [{
              test_run_id: this.testRunId,
              test_suite: testSuiteName,
              test_name: testName,
              status: testStatus,
              duration_ms: result.duration || 0,
              error_message: failureMessages.length > 0 ? failureMessages[0] : null,
              stack_trace: failureMessages.length > 0 ? failureMessages.join('\n') : null,
              console_output: consoleOutput
            }]
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to save test result for ${testName}: ${errorText}`);
        }
      } catch (error) {
        console.error(`Error saving test result for ${testName}:`, error);
      }
    }
    
    this.results.duration += testResult.perfStats.end - testResult.perfStats.start;
  }

  async onRunComplete(contexts, results) {
    if (!this.testRunId) {
      console.error('No testRunId available. Cannot update test run summary.');
      return;
    }
    
    console.log(`Test run complete. Updating test run ${this.testRunId} with summary results.`);
    console.log(`Summary: ${this.results.passed} passed, ${this.results.failed} failed, ${this.results.skipped} skipped`);
    
    try {
      // Send final summary with accurate counts
      const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/report-test-results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.TEST_REPORTING_API_KEY
        },
        body: JSON.stringify({
          test_run_id: this.testRunId,
          total_tests: this.results.total,
          passed_tests: this.results.passed,
          failed_tests: this.results.failed,
          skipped_tests: this.results.skipped,
          duration_ms: this.results.duration,
          status: this.results.failed > 0 ? 'failure' : 'success'
        })
      });
      
      if (response.ok) {
        console.log(`Test run updated successfully. View results at ${process.env.APP_URL || ''}/admin/tests/${this.testRunId}`);
      } else {
        const errorText = await response.text();
        console.error('Failed to update test run:', errorText);
      }
    } catch (error) {
      console.error('Error updating test run:', error);
    }
  }
}

module.exports = TestReporter;
