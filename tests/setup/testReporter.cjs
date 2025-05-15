
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
  }

  async onRunStart() {
    if (!this.testRunId) {
      try {
        // Create a new test run in Supabase
        const response = await fetch(`${process.env.SUPABASE_URL}/functions/report-test-results`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.TEST_REPORTING_API_KEY || 'test-key'
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
        
        if (response.ok) {
          const data = await response.json();
          this.testRunId = data.test_run_id;
          process.env.TEST_RUN_ID = this.testRunId;
          console.log(`Created test run with ID: ${this.testRunId}`);
        } else {
          console.error('Failed to create test run via edge function:', await response.text());
        }
      } catch (error) {
        console.error('Error creating test run:', error);
      }
    }
  }

  async onTestResult(test, testResult) {
    const { testResults, testFilePath } = testResult;
    
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
      
      if (this.testRunId) {
        try {
          // Use the edge function to save test results
          const response = await fetch(`${process.env.SUPABASE_URL}/functions/report-test-results`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.TEST_REPORTING_API_KEY || 'test-key'
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
            console.error(`Failed to save test result for ${testName}: ${await response.text()}`);
          }
        } catch (error) {
          console.error(`Error saving test result for ${testName}:`, error);
        }
      }
    }
    
    // Update total duration
    this.results.duration += testResult.perfStats.end - testResult.perfStats.start;
  }

  async onRunComplete(contexts, results) {
    if (this.testRunId) {
      try {
        // Update test run with final results using the edge function
        const response = await fetch(`${process.env.SUPABASE_URL}/functions/report-test-results`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.TEST_REPORTING_API_KEY || 'test-key'
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
          console.log(`Test run updated: ${this.results.passed} passed, ${this.results.failed} failed, ${this.results.skipped} skipped`);
          console.log(`View full results at ${process.env.APP_URL || ''}/admin/tests/${this.testRunId}`);
        } else {
          console.error('Failed to update test run via edge function:', await response.text());
        }
      } catch (error) {
        console.error('Error updating test run:', error);
      }
    }
  }
}

module.exports = TestReporter;
