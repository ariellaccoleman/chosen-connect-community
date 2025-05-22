
#!/usr/bin/env node

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
      reportedTests: new Set(),
      // Track test suites
      suites: new Map(),
      // Track current suite being processed
      currentSuite: null
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
      // Create a new test run only if we don't already have a test run ID
      if (!this.testRunId) {
        console.log(`Creating new test run via ${process.env.SUPABASE_URL}/functions/v1/report-test-results/create-run`);
        
        // Create a new test run in Supabase
        const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/report-test-results/create-run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.TEST_REPORTING_API_KEY
          },
          body: JSON.stringify({
            git_commit: process.env.GITHUB_SHA || null,
            git_branch: process.env.GITHUB_REF_NAME || null,
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

  async onTestFileStart(test) {
    if (!this.testRunId) {
      console.error('No testRunId available. Cannot record test suite.');
      return;
    }

    // Add defensive check for test
    if (!test) {
      console.error('Test object is undefined in onTestFileStart');
      return;
    }

    const testFilePath = test.path;
    // Extract suite name from file path
    const testSuitePath = testFilePath.split('/');
    const suiteName = testSuitePath[testSuitePath.length - 1].replace('.test.ts', '').replace('.test.tsx', '');
    
    console.log(`Starting test suite: ${suiteName} (${testFilePath})`);

    this.results.currentSuite = {
      path: testFilePath,
      name: suiteName,
      startTime: Date.now(),
      testCount: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      id: null
    };
    
    try {
      // Record that the suite is starting - use 'in_progress' as initial status
      const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/report-test-results/record-suite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.TEST_REPORTING_API_KEY
        },
        body: JSON.stringify({
          test_run_id: this.testRunId,
          suite_name: suiteName,
          file_path: testFilePath,
          status: 'in_progress',
          test_count: 0,
          duration_ms: 0
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        this.results.currentSuite.id = data.test_suite_id;
        console.log(`Recorded start of test suite ${suiteName} with ID ${data.test_suite_id}`);
      } else {
        const errorText = await response.text();
        console.error(`Failed to record test suite start: ${errorText}`);
      }
    } catch (error) {
      console.error(`Error recording test suite start for ${suiteName}:`, error);
    }

    // Store the suite in our map
    this.results.suites.set(testFilePath, this.results.currentSuite);
  }

  async onTestFileResult(test, testResult) {
    // Add detailed logging to debug the issue
    console.log(`onTestFileResult called with test: ${test ? 'defined' : 'undefined'} and testResult: ${testResult ? 'defined' : 'undefined'}`);
    
    if (!test) {
      console.error('Test object is undefined in onTestFileResult');
      return;
    }

    if (!testResult) {
      console.error('TestResult object is undefined in onTestFileResult');
      return;
    }

    const testFilePath = test.path;
    console.log(`Looking for suite with testFilePath: ${testFilePath}`);
    
    const suite = this.results.suites.get(testFilePath);
    
    if (!suite) {
      console.error(`No suite found for ${testFilePath}`);
      // Let's see what suites we do have
      console.log('Current suites in map:', Array.from(this.results.suites.keys()));
      return;
    }
    
    // Calculate test duration
    const duration = Date.now() - suite.startTime;

    // Update suite stats based on test results
    const testCount = testResult.numPassingTests + testResult.numFailingTests + testResult.numPendingTests;
    suite.testCount = testCount;
    suite.passed = testResult.numPassingTests;
    suite.failed = testResult.numFailingTests;
    suite.skipped = testResult.numPendingTests;
    
    // Determine final status from actual test results
    const status = testResult.numFailingTests > 0 ? 'failure' : 'success';
    
    console.log(`Completed test suite: ${suite.name} - ${status} (${testCount} tests, ${duration}ms)`);
    console.log(`Suite ID for updating results: ${suite.id}`);
    
    if (!this.testRunId) {
      console.error('No testRunId available. Cannot update test suite.');
      return;
    }
    
    try {
      // Now process the individual tests in this suite - do this BEFORE updating suite status
      await this.processTestResults(testResult, suite);
      
      // Update the suite record with final results
      const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/report-test-results/record-suite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.TEST_REPORTING_API_KEY
        },
        body: JSON.stringify({
          test_run_id: this.testRunId,
          suite_name: suite.name,
          file_path: testFilePath,
          status: status,
          test_count: testCount,
          duration_ms: duration,
          error_message: testResult.failureMessage || null,
          suite_id: suite.id // Include the suite ID for proper updating
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to update test suite: ${errorText}`);
      } else {
        const data = await response.json();
        console.log(`Updated test suite ${suite.name} with ID ${data.test_suite_id}`);
      }
    } catch (error) {
      console.error(`Error updating test suite ${suite.name}:`, error);
    }

    // Clear current suite
    this.results.currentSuite = null;
  }

  async processTestResults(testResult, suite) {
    // Add more logging to debug the issue
    if (!testResult) {
      console.error('testResult is undefined in processTestResults');
      return;
    }
    
    if (!suite) {
      console.error('suite is undefined in processTestResults');
      return;
    }
    
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
    
    if (!suite || !suite.id) {
      console.error(`Missing suite ID for test file: ${testFilePath}`);
      return;
    }
    
    console.log(`Reporting ${testResults?.length || 0} test results for ${testFilePath} to test run ${this.testRunId}`);
    console.log(`Test suite ID for test results: ${suite.id}`);
    
    // Extract test suite name from file path
    const testSuitePath = testFilePath.split('/');
    const testSuiteName = testSuitePath[testSuitePath.length - 1].replace('.test.ts', '').replace('.test.tsx', '');
    
    // Process each test and send individually
    for (const result of testResults || []) {
      // Skip if result is undefined
      if (!result) {
        console.warn('Skipping undefined test result');
        continue;
      }
      
      const testStatus = result.status === 'passed' ? 'passed' : 
                        result.status === 'failed' ? 'failed' : 'skipped';
      
      // Handle different test result formats for the title
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
      
      // Create a unique identifier for this test
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
      
      console.log(`- Test: ${testName}, Status: ${testStatus}, Suite ID: ${suite.id}`);
      
      // Safely handle possibly undefined properties
      const failureMessages = result.failureMessages || [];
      const consoleOutput = result.console && result.console.length > 0 
        ? result.console.map(c => `[${c.type}] ${c.message}`).join('\n') 
        : null;
      
      try {
        // Submit individual test result via the record-result endpoint
        const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/report-test-results/record-result`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.TEST_REPORTING_API_KEY
          },
          body: JSON.stringify({
            test_run_id: this.testRunId,
            test_suite_id: suite.id,
            test_suite: testSuiteName,
            test_name: testName,
            status: testStatus,
            duration_ms: result.duration || 0,
            error_message: failureMessages.length > 0 ? failureMessages[0] : null,
            stack_trace: failureMessages.length > 0 ? failureMessages.join('\n') : null,
            console_output: consoleOutput
          })
        });

        if (!response.ok) {
          const responseText = await response.text();
          console.error(`Failed to save test result: ${responseText}`);
        } else {
          console.log(`Successfully reported test result: ${testName}`);
        }
      } catch (error) {
        console.error(`Error saving test result for ${testName}:`, error);
      }
    }
    
    // Update total duration
    this.results.duration += testResult.perfStats.end - testResult.perfStats.start;
  }

  async onTestResult(test, testResult) {
    console.log(`onTestResult called with test: ${test ? 'defined' : 'undefined'} and testResult: ${testResult ? 'defined' : 'undefined'}`);
    
    // Most of the work is done in onTestFileResult now
    // This method is kept for backward compatibility
    if (!test || test === undefined) {
      console.warn('Received undefined test in onTestResult - skipping');
      return;
    }
    
    // Defensive check for testResult
    if (!testResult) {
      console.warn('Received undefined testResult in onTestResult - skipping');
      return;
    }
    
    // Log testFilePath to help debugging
    if (test && test.path) {
      console.log(`onTestResult for test path: ${test.path}`);
    }
  }

  async onRunComplete(contexts, results) {
    if (!this.testRunId) {
      console.error('No testRunId available. Cannot update test run summary.');
      return;
    }
    
    console.log(`Test run complete. Updating test run ${this.testRunId} with final summary results.`);
    console.log(`Final counts: ${this.results.passed} passed, ${this.results.failed} failed, ${this.results.skipped} skipped, total: ${this.results.total}`);
    
    // Determine final status
    const status = this.results.failed > 0 ? 'failure' : 'success';
    
    try {
      // Update test run with final results via the update-run endpoint
      console.log(`Sending final update to ${process.env.SUPABASE_URL}/functions/v1/report-test-results/update-run`);
      const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/report-test-results/update-run`, {
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
          status: status
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
