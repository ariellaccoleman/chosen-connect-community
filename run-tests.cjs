#!/usr/bin/env node

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { v4: uuidv4 } = require('uuid');
// Replace node-fetch with a compatible CommonJS alternative
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Supabase URL and key - will be used in production
const SUPABASE_URL = process.env.SUPABASE_URL || "https://nvaqqkffmfuxdnwnqhxo.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52YXFxa2ZmbWZ1eGRud25xaHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNDgxODYsImV4cCI6MjA2MTgyNDE4Nn0.rUwLwOr8QSzhJi3J2Mi_D94Zy-zLWykw7_mXY29UmP4";

// Create a custom Jest reporter to capture test results
const TEST_REPORTER_PATH = './tests/setup/testReporter.cjs'; // Changed extension to .cjs
if (!existsSync(TEST_REPORTER_PATH)) {
  const testReporterDir = './tests/setup';
  if (!existsSync(testReporterDir)) {
    execSync('mkdir -p ./tests/setup', { stdio: 'inherit' });
  }
  
  const reporterCode = `
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
        const response = await fetch(\`\${process.env.SUPABASE_URL}/rest/v1/test_runs\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_KEY,
            'Authorization': \`Bearer \${process.env.SUPABASE_KEY}\`
          },
          body: JSON.stringify({
            status: 'in_progress',
            git_commit: process.env.GITHUB_SHA || null,
            git_branch: process.env.GITHUB_REF_NAME || null,
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          this.testRunId = data[0].id;
          process.env.TEST_RUN_ID = this.testRunId;
          console.log(\`Created test run with ID: \${this.testRunId}\`);
        } else {
          console.error('Failed to create test run in Supabase');
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
      
      // Collect result details
      const testResult = {
        test_run_id: this.testRunId,
        test_suite: testSuiteName,
        test_name: result.title.join(' > '),
        status: testStatus,
        duration_ms: result.duration || 0,
        error_message: result.failureMessages.length > 0 ? result.failureMessages[0] : null,
        stack_trace: result.failureMessages.length > 0 ? result.failureMessages.join('\\n') : null,
        console_output: result.console && result.console.length > 0 
          ? result.console.map(c => \`[\${c.type}] \${c.message}\`).join('\\n') 
          : null
      };
      
      this.results.testResults.push(testResult);
      
      if (this.testRunId) {
        try {
          // Save test result to Supabase
          const response = await fetch(\`\${process.env.SUPABASE_URL}/rest/v1/test_results\`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.SUPABASE_KEY,
              'Authorization': \`Bearer \${process.env.SUPABASE_KEY}\`
            },
            body: JSON.stringify(testResult)
          });
          
          if (!response.ok) {
            console.error(\`Failed to save test result for \${testResult.test_name}\`);
          }
        } catch (error) {
          console.error(\`Error saving test result for \${testResult.test_name}:\`, error);
        }
      }
    }
    
    // Update total duration
    this.results.duration += testResult.perfStats.end - testResult.perfStats.start;
  }

  async onRunComplete(contexts, results) {
    if (this.testRunId) {
      try {
        // Update test run with final results
        const response = await fetch(\`\${process.env.SUPABASE_URL}/rest/v1/test_runs?id=eq.\${this.testRunId}\`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_KEY,
            'Authorization': \`Bearer \${process.env.SUPABASE_KEY}\`
          },
          body: JSON.stringify({
            total_tests: this.results.total,
            passed_tests: this.results.passed,
            failed_tests: this.results.failed,
            skipped_tests: this.results.skipped,
            duration_ms: this.results.duration,
            status: this.results.failed > 0 ? 'failure' : 'success'
          })
        });
        
        if (response.ok) {
          console.log(\`Test run updated: \${this.results.passed} passed, \${this.results.failed} failed, \${this.results.skipped} skipped\`);
          console.log(\`View full results at \${process.env.APP_URL || ''}/admin/tests/\${this.testRunId}\`);
        } else {
          console.error('Failed to update test run in Supabase');
        }
      } catch (error) {
        console.error('Error updating test run:', error);
      }
    }
  }
}

module.exports = TestReporter;
  `;
  
  require('fs').writeFileSync(TEST_REPORTER_PATH, reporterCode);
  console.log('Created test reporter at', TEST_REPORTER_PATH);
}

// Check if Jest is installed
try {
  require.resolve('jest');
  console.log('Jest is installed, checking for additional dependencies...');
} catch (e) {
  console.log('Jest is not installed. Installing required packages...');
  
  // Install necessary testing packages
  const packages = [
    'jest',
    'ts-jest',
    '@types/jest',
    '@testing-library/react',
    '@testing-library/jest-dom',
    '@testing-library/user-event',
    'jest-environment-jsdom', // Add jsdom environment explicitly
    'uuid',
    'node-fetch'
  ];
  
  try {
    execSync(`npm install --no-save ${packages.join(' ')}`, { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to install packages:', error);
    process.exit(1);
  }
}

// Check specifically for jest-environment-jsdom and other dependencies
const additionalDeps = ['jest-environment-jsdom', 'uuid', 'node-fetch'];
for (const dep of additionalDeps) {
  try {
    require.resolve(dep);
  } catch (e) {
    console.log(`${dep} is not installed. Installing...`);
    try {
      execSync(`npm install --no-save ${dep}`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`Failed to install ${dep}:`, error);
      process.exit(1);
    }
  }
}

// Generate a test run ID
const testRunId = uuidv4();
process.env.TEST_RUN_ID = testRunId;
process.env.SUPABASE_URL = SUPABASE_URL;
process.env.SUPABASE_KEY = SUPABASE_KEY;

// Ensure test setup directory exists
if (!existsSync('./tests/setup')) {
  execSync('mkdir -p ./tests/setup', { stdio: 'inherit' });
}

// Run tests with custom reporter
const testPathPattern = process.argv[2] || '';
try {
  console.log(`Running tests${testPathPattern ? ` matching pattern: ${testPathPattern}` : ''}...`);
  console.log(`Test run ID: ${testRunId}`);
  
  execSync(
    `npx jest ${testPathPattern} --reporters=default --reporters=${TEST_REPORTER_PATH}`,
    { 
      stdio: 'inherit',
      env: {
        ...process.env,
        TEST_RUN_ID: testRunId,
        SUPABASE_URL: SUPABASE_URL,
        SUPABASE_KEY: SUPABASE_KEY
      }
    }
  );
} catch (error) {
  console.error('Tests failed with error code:', error.status);
  process.exit(1);
}
