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
      // Track all test suites by their unique file path
      suites: new Map(),
      // Track which tests have been reported to prevent duplicates
      reportedTests: new Set()
    };
    
    console.log(`TestReporter initialized with TEST_RUN_ID: ${this.testRunId || 'not set'}`);
    console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL || 'not set'}`);
    console.log(`TEST_REPORTING_API_KEY: ${process.env.TEST_REPORTING_API_KEY ? '[SET]' : '[NOT SET]'}`);
  }

  /**
   * Get a simplified test file path that removes project-specific prefixes
   * and has consistent format across environments
   */
  getSimplifiedPath(filePath) {
    if (!filePath) return 'unknown-path';
    
    // Convert backslashes to forward slashes for consistency
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Extract just the relevant part of the path (after tests/)
    const testsMatch = normalizedPath.match(/\/tests\/(.+)$/);
    if (testsMatch && testsMatch[1]) {
      return `tests/${testsMatch[1]}`;
    }
    
    return normalizedPath;
  }

  /**
   * Extract the base suite name from a file path
   */
  getSuiteName(filePath) {
    if (!filePath) return 'unknown-suite';
    
    // Get just the filename without extension or path
    const filename = filePath.split('/').pop() || '';
    const suiteName = filename.replace(/\.test\.(ts|tsx|js|jsx)$/, '');
    
    return suiteName;
  }

  /**
   * Create a unique ID for this test suite that will remain consistent
   * throughout the test run
   */
  getSuiteId(filePath) {
    return this.getSimplifiedPath(filePath);
  }

  /**
   * Called when Jest starts the test run
   */
  async onRunStart() {
    console.log(`onRunStart called, testRunId: ${this.testRunId || 'not set'}`);
    
    // Validate required environment variables
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

  /**
   * Called when a test file starts execution
   */
  async onTestFileStart(test) {
    if (!test || !test.path) {
      console.error('Test object or test path is undefined in onTestFileStart');
      return;
    }

    const suiteId = this.getSuiteId(test.path);
    const suiteName = this.getSuiteName(test.path);
    const simplifiedPath = this.getSimplifiedPath(test.path);
    
    console.log(`Starting test suite: "${suiteName}" (${simplifiedPath})`);
    
    // Create suite object if it doesn't exist
    if (!this.results.suites.has(suiteId)) {
      const suiteInfo = {
        id: null,          // Database ID, set when recorded
        path: test.path,
        simplifiedPath,
        name: suiteName,
        startTime: Date.now(),
        tests: [],
        passed: 0,
        failed: 0,
        skipped: 0
      };
      
      this.results.suites.set(suiteId, suiteInfo);
      
      // Try to record the suite start in the database
      try {
        if (!this.testRunId) {
          console.error('No testRunId available. Cannot record test suite.');
          return;
        }
        
        const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/report-test-results/record-suite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.TEST_REPORTING_API_KEY
          },
          body: JSON.stringify({
            test_run_id: this.testRunId,
            suite_name: suiteName,
            file_path: simplifiedPath,
            status: 'in_progress',
            test_count: 0,
            duration_ms: 0
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          suiteInfo.id = data.test_suite_id;
          console.log(`Recorded start of test suite "${suiteName}" with ID ${data.test_suite_id}`);
        } else {
          const errorText = await response.text();
          console.error(`Failed to record test suite start: ${errorText}`);
        }
      } catch (error) {
        console.error(`Error recording test suite start for ${suiteName}:`, error);
      }
    }
  }

  /**
   * Process individual test results and send them to the API
   */
  async processTestResults(testResult, suite) {
    if (!testResult || !suite) {
      console.error('testResult or suite is undefined in processTestResults');
      return;
    }
    
    if (!testResult.testResults) {
      console.error('No testResults array found in testResult object');
      return;
    }
    
    if (!this.testRunId || !suite.id) {
      console.error(`Cannot report test results - testRunId: ${this.testRunId}, suiteId: ${suite.id}`);
      return;
    }
    
    console.log(`Processing ${testResult.testResults.length} test results for "${suite.name}" (Suite ID: ${suite.id})`);
    
    // Add special handling for suites that failed to run
    if (testResult.testExecError) {
      try {
        // Submit a synthetic test result for the entire suite failure
        const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/report-test-results/record-result`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.TEST_REPORTING_API_KEY
          },
          body: JSON.stringify({
            test_run_id: this.testRunId,
            test_suite_id: suite.id,
            test_suite: suite.name,
            test_name: 'Suite Failed To Run',
            status: 'failed',
            duration_ms: 0,
            error_message: testResult.testExecError.message,
            stack_trace: testResult.testExecError.stack || null,
            console_output: null
          })
        });

        if (!response.ok) {
          const responseText = await response.text();
          console.error(`Failed to save suite failure test result: ${responseText}`);
        } else {
          console.log(`Successfully reported suite failure for: ${suite.name}`);
        }
      } catch (error) {
        console.error(`Error saving suite failure result for ${suite.name}:`, error);
      }
      
      // Add synthetic test to our totals
      this.results.total++;
      this.results.failed++;
    }
    
    // Process each test and send individually
    for (const result of testResult.testResults || []) {
      if (!result) {
        console.warn('Skipping undefined test result');
        continue;
      }
      
      // Get proper test status
      const testStatus = result.status === 'passed' ? 'passed' : 
                        result.status === 'failed' ? 'failed' : 'skipped';
      
      // Properly format the test name
      let testName = '';
      if (Array.isArray(result.ancestorTitles) && result.title) {
        // Include ancestor titles for nested describes
        const ancestors = result.ancestorTitles.filter(Boolean);
        testName = [...ancestors, result.title].join(' > ');
      } else if (typeof result.title === 'string') {
        testName = result.title;
      } else if (result.fullName) {
        testName = result.fullName;
      } else {
        testName = `Test #${this.results.total}`;
      }
      
      // Create a unique identifier for this test
      const testId = `${suite.id}:${testName}`;
      
      // Skip if we've already reported this test
      if (this.results.reportedTests.has(testId)) {
        console.log(`Skipping duplicate test: ${testName}`);
        continue;
      }
      
      // Mark this test as reported
      this.results.reportedTests.add(testId);
      
      // Update summary counts
      this.results.total++;
      if (testStatus === 'passed') this.results.passed++;
      else if (testStatus === 'failed') this.results.failed++;
      else this.results.skipped++;
      
      console.log(`- Test: "${testName}", Status: ${testStatus}, Suite: ${suite.name} (ID: ${suite.id})`);
      
      // Safely handle possibly undefined properties
      const failureMessages = result.failureMessages || [];
      const consoleOutput = result.console && result.console.length > 0 
        ? result.console.map(c => `[${c.type}] ${c.message}`).join('\n') 
        : null;
      
      try {
        // Submit individual test result
        const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/report-test-results/record-result`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.TEST_REPORTING_API_KEY
          },
          body: JSON.stringify({
            test_run_id: this.testRunId,
            test_suite_id: suite.id,
            test_suite: suite.name,
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
          console.log(`Successfully reported test result: "${testName}"`);
        }
      } catch (error) {
        console.error(`Error saving test result for ${testName}:`, error);
      }
    }
  }

  /**
   * Called when a test file completes execution
   */
  async onTestFileResult(test, testResult) {
    if (!test || !test.path || !testResult) {
      console.error('Missing test or testResult object in onTestFileResult');
      return;
    }

    const suiteId = this.getSuiteId(test.path);
    const suite = this.results.suites.get(suiteId);
    
    if (!suite) {
      console.error(`Suite not found for ${test.path} in onTestFileResult`);
      return;
    }
    
    // Calculate test duration
    const duration = suite.startTime ? (Date.now() - suite.startTime) : 0;

    // Update suite stats based on test results
    const testCount = testResult.numPassingTests + testResult.numFailingTests + testResult.numPendingTests;
    suite.testCount = testCount;
    suite.passed = testResult.numPassingTests;
    suite.failed = testResult.numFailingTests;
    suite.skipped = testResult.numPendingTests;
    
    // Determine status from actual test results
    const status = testResult.testExecError || testResult.numFailingTests > 0 ? 'failure' : 'success';
    
    console.log(`Completed test suite: "${suite.name}" - ${status} (${testCount} tests, ${duration}ms)`);
    
    if (!this.testRunId) {
      console.error('No testRunId available. Cannot update test suite.');
      return;
    }
    
    try {
      // First process the individual tests in this suite
      await this.processTestResults(testResult, suite);
      
      // Then update the suite record with final results
      const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/report-test-results/record-suite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.TEST_REPORTING_API_KEY
        },
        body: JSON.stringify({
          test_run_id: this.testRunId,
          suite_name: suite.name,
          file_path: suite.simplifiedPath,
          status: status,
          test_count: testCount,
          duration_ms: duration,
          error_message: testResult.testExecError ? testResult.testExecError.message : (testResult.failureMessage || null),
          suite_id: suite.id // Include the suite ID for proper updating
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to update test suite: ${errorText}`);
      } else {
        const data = await response.json();
        console.log(`Updated test suite "${suite.name}" with ID ${data.test_suite_id}`);
      }
    } catch (error) {
      console.error(`Error updating test suite ${suite.name}:`, error);
    }
  }

  /**
   * Called for each test result - we'll mostly rely on onTestFileResult
   * but keep this for compatibility
   */
  async onTestResult(test, testResult) {
    // Most work is done in onTestFileResult
    if (test && test.path) {
      console.log(`onTestResult triggered for test path: ${test.path}`);
    }
  }

  /**
   * Called when the entire test run completes
   */
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
      // Update test run with final results
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
