#!/usr/bin/env node

class TestReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
    this.testRunId = process.env.TEST_RUN_ID || null;
    
    // Use production project for test reporting
    this.reportingUrl = process.env.PROD_SUPABASE_URL || process.env.SUPABASE_URL || "https://nvaqqkffmfuxdnwnqhxo.supabase.co";
    this.reportingApiKey = process.env.TEST_REPORTING_API_KEY;
    
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
    
    // Global console logs for run-level debugging (kept for compatibility)
    this.consoleLogs = [];
    this.originalConsole = {};
    
    // Set up minimal console capture for run-level logs
    this.setupGlobalConsoleCapture();
    
    console.log(`TestReporter initialized with TEST_RUN_ID: ${this.testRunId || 'not set'}`);
    console.log(`Reporting to PRODUCTION PROJECT: ${this.reportingUrl}`);
    console.log(`TEST_REPORTING_API_KEY: ${this.reportingApiKey ? '[SET]' : '[NOT SET]'}`);
  }

  /**
   * Set up minimal global console capture for run-level logs only
   */
  setupGlobalConsoleCapture() {
    const logLevels = ['log', 'info', 'warn', 'error', 'debug'];
    
    logLevels.forEach(level => {
      this.originalConsole[level] = console[level];
      console[level] = (...args) => {
        // Only capture run-level logs (setup/teardown), not test-specific logs
        if (!this.isInTestExecution()) {
          const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            source: 'test-runner',
            message: args.map(arg => {
              if (typeof arg === 'object') {
                try {
                  return JSON.stringify(arg, null, 2);
                } catch (e) {
                  return String(arg);
                }
              }
              return String(arg);
            }).join(' '),
            stack: level === 'error' && args[0] instanceof Error ? args[0].stack : null
          };
          
          this.consoleLogs.push(logEntry);
        }
        
        // Call original console method
        this.originalConsole[level](...args);
      };
    });
    
    console.log('📝 Global console capture started for run-level logs');
  }

  /**
   * Simple heuristic to detect if we're currently executing tests
   * This is not perfect but helps reduce noise in global logs
   */
  isInTestExecution() {
    // Check if we're likely in a test by looking at the call stack
    const stack = new Error().stack || '';
    return stack.includes('jest') || stack.includes('test') || stack.includes('spec');
  }

  /**
   * Process Jest's per-test console output and format it properly
   */
  formatTestConsoleOutput(testConsoleEntries) {
    if (!testConsoleEntries || testConsoleEntries.length === 0) {
      return null;
    }

    const formattedEntries = testConsoleEntries.map(entry => {
      // Jest console entries have: { type, message, origin }
      const timestamp = new Date().toISOString();
      const level = entry.type || 'log';
      const message = entry.message || '';
      const origin = entry.origin || '';

      return `[${timestamp}] [${level.toUpperCase()}] ${message}${origin ? ` (${origin})` : ''}`;
    });

    return formattedEntries.join('\n');
  }

  /**
   * Extract error-related console entries from Jest's console output
   */
  extractErrorConsoleOutput(testConsoleEntries) {
    if (!testConsoleEntries || testConsoleEntries.length === 0) {
      return null;
    }

    // Filter for error and warn level entries
    const errorEntries = testConsoleEntries.filter(entry => {
      const type = entry.type || '';
      const message = entry.message || '';
      
      return type === 'error' || 
             type === 'warn' || 
             message.toLowerCase().includes('error') ||
             message.toLowerCase().includes('failed') ||
             message.toLowerCase().includes('warning');
    });

    if (errorEntries.length === 0) {
      return null;
    }

    return this.formatTestConsoleOutput(errorEntries);
  }

  /**
   * Restore original console methods
   */
  restoreConsole() {
    Object.keys(this.originalConsole).forEach(level => {
      console[level] = this.originalConsole[level];
    });
    console.log('📝 Console capture restored');
  }

  /**
   * Send console logs to the server with enhanced error handling
   */
  async sendConsoleLogs() {
    if (!this.testRunId || this.consoleLogs.length === 0) {
      console.log('📝 No run-level logs to send or no test run ID');
      return;
    }

    try {
      console.log(`📝 Sending ${this.consoleLogs.length} run-level console log entries to production database...`);
      
      const response = await fetch(`${this.reportingUrl}/functions/v1/report-test-results/record-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.reportingApiKey
        },
        body: JSON.stringify({
          test_run_id: this.testRunId,
          logs: this.consoleLogs
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Successfully sent ${data.total_logs || this.consoleLogs.length} run-level logs to production database`);
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to send console logs: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error sending console logs:', error);
    }
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
    console.log(`Reporting to production project: ${this.reportingUrl}`);
    console.log(`Console capture active for run-level logs only`);
    
    // Validate required environment variables
    if (!this.reportingUrl) {
      console.error('Production Supabase URL is not set. Cannot create test run.');
      return;
    }
    
    if (!this.reportingApiKey) {
      console.error('TEST_REPORTING_API_KEY is not set. Cannot create test run.');
      return;
    }
    
    try {
      // Create a new test run only if we don't already have a test run ID
      if (!this.testRunId) {
        console.log(`Creating new test run via ${this.reportingUrl}/functions/v1/report-test-results/create-run (PRODUCTION)`);
        
        // Create a new test run in Production Supabase
        const response = await fetch(`${this.reportingUrl}/functions/v1/report-test-results/create-run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.reportingApiKey
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
            console.log(`Created test run with ID: ${this.testRunId} (in PRODUCTION)`);
          } else {
            console.error('Failed to create test run via edge function:', data);
          }
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', responseText);
        }
      } else {
        console.log(`Using existing test run ID: ${this.testRunId} (reporting to PRODUCTION)`);
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
      
      // Try to record the suite start in the production database
      try {
        if (!this.testRunId) {
          console.error('No testRunId available. Cannot record test suite.');
          return;
        }
        
        const response = await fetch(`${this.reportingUrl}/functions/v1/report-test-results/record-suite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.reportingApiKey
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
          console.log(`Recorded start of test suite "${suiteName}" with ID ${data.test_suite_id} (in PRODUCTION)`);
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
   * Process individual test results with enhanced console output handling
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
    
    console.log(`Processing ${testResult.testResults.length} test results for "${suite.name}" (Suite ID: ${suite.id}) -> PRODUCTION`);
    
    // Add special handling for suites that failed to run
    if (testResult.testExecError) {
      try {
        // Submit a synthetic test result for the entire suite failure
        const response = await fetch(`${this.reportingUrl}/functions/v1/report-test-results/record-result`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.reportingApiKey
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
          console.log(`Successfully reported suite failure for: ${suite.name} -> PRODUCTION`);
        }
      } catch (error) {
        console.error(`Error saving suite failure result for ${suite.name}:`, error);
      }
      
      // Add synthetic test to our totals
      this.results.total++;
      this.results.failed++;
    }
    
    // Process each test and send individually to production with enhanced console handling
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
      
      console.log(`- Test: "${testName}", Status: ${testStatus}, Suite: ${suite.name} (ID: ${suite.id}) -> PRODUCTION`);
      
      // Enhanced console output handling using Jest's per-test console data
      let consoleOutput = null;
      let errorConsoleOutput = null;
      
      if (result.console && result.console.length > 0) {
        // Format all console output for this specific test
        consoleOutput = this.formatTestConsoleOutput(result.console);
        
        // Extract error-related console output
        errorConsoleOutput = this.extractErrorConsoleOutput(result.console);
        
        console.log(`  📝 Test "${testName}" generated ${result.console.length} console entries`);
        if (errorConsoleOutput) {
          console.log(`  ⚠️ Test "${testName}" had error console output`);
        }
      }
      
      // Combine error message with error console output for failed tests
      const failureMessages = result.failureMessages || [];
      let combinedErrorMessage = null;
      
      if (testStatus === 'failed') {
        const parts = [];
        
        // Add original failure message
        if (failureMessages.length > 0) {
          parts.push('Test Failure:');
          parts.push(failureMessages[0]);
        }
        
        // Add error console output if available
        if (errorConsoleOutput) {
          parts.push('');
          parts.push('Console Errors During Test:');
          parts.push(errorConsoleOutput);
        }
        
        combinedErrorMessage = parts.length > 0 ? parts.join('\n') : null;
      }
      
      try {
        // Submit individual test result to production with enhanced error info
        const response = await fetch(`${this.reportingUrl}/functions/v1/report-test-results/record-result`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.reportingApiKey
          },
          body: JSON.stringify({
            test_run_id: this.testRunId,
            test_suite_id: suite.id,
            test_suite: suite.name,
            test_name: testName,
            status: testStatus,
            duration_ms: result.duration || 0,
            error_message: combinedErrorMessage || (failureMessages.length > 0 ? failureMessages[0] : null),
            stack_trace: failureMessages.length > 0 ? failureMessages.join('\n') : null,
            console_output: consoleOutput
          })
        });

        if (!response.ok) {
          const responseText = await response.text();
          console.error(`Failed to save test result: ${responseText}`);
        } else {
          console.log(`Successfully reported test result: "${testName}" -> PRODUCTION`);
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
    
    console.log(`Completed test suite: "${suite.name}" - ${status} (${testCount} tests, ${duration}ms) -> PRODUCTION`);
    
    if (!this.testRunId) {
      console.error('No testRunId available. Cannot update test suite.');
      return;
    }
    
    try {
      // First process the individual tests in this suite
      await this.processTestResults(testResult, suite);
      
      // Then update the suite record with final results in production
      const response = await fetch(`${this.reportingUrl}/functions/v1/report-test-results/record-suite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.reportingApiKey
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
        console.log(`Updated test suite "${suite.name}" with ID ${data.test_suite_id} -> PRODUCTION`);
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
    
    console.log(`Test run complete. Updating test run ${this.testRunId} with final summary results -> PRODUCTION.`);
    console.log(`Final counts: ${this.results.passed} passed, ${this.results.failed} failed, ${this.results.skipped} skipped, total: ${this.results.total}`);
    console.log(`Total run-level console logs captured: ${this.consoleLogs.length}`);
    
    // Determine final status
    const status = this.results.failed > 0 ? 'failure' : 'success';
    
    try {
      // Update test run with final results in production
      console.log(`Sending final update to ${this.reportingUrl}/functions/v1/report-test-results/update-run (PRODUCTION)`);
      const response = await fetch(`${this.reportingUrl}/functions/v1/report-test-results/update-run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.reportingApiKey
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
        console.log(`Test run updated successfully with final counts in PRODUCTION. Response:`, JSON.stringify(responseData));
        console.log(`View full results at ${process.env.APP_URL || 'https://app.chosen.dev'}/admin/test-reports/${this.testRunId}`);
      } else {
        const errorText = await response.text();
        console.error('Failed to update test run via edge function:', errorText);
        console.error('Response status:', response.status);
      }
      
      // Send run-level console logs to production database
      await this.sendConsoleLogs();
      
    } catch (error) {
      console.error('Error updating test run:', error);
    } finally {
      // Restore original console methods
      this.restoreConsole();
    }
  }
}

module.exports = TestReporter;
