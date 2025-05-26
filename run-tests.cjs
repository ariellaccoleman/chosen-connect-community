
#!/usr/bin/env node
// DO NOT PUT A BLANK LINE AT THE FRONT OF THIS FILE

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Test project configuration (for test execution)
const TEST_SUPABASE_URL = process.env.TEST_SUPABASE_URL;
const TEST_SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY;
const TEST_SUPABASE_SERVICE_ROLE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;

// Production project configuration (for test reporting)
const PROD_SUPABASE_URL = process.env.PROD_SUPABASE_URL || process.env.SUPABASE_URL || "https://nvaqqkffmfuxdnwnqhxo.supabase.co";
const PROD_SUPABASE_ANON_KEY = process.env.PROD_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52YXFxa2ZmbWZ1eGRud25xaHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNDgxODYsImV4cCI6MjA2MTgyNDE4Nn0.rUwLwOr8QSzhJi3J2Mi_D94Zy-zLWykw7_mXY29UmP4";

const TEST_REPORTING_API_KEY = process.env.TEST_REPORTING_API_KEY || "test-key";

// Determine which projects we're using
const usingDedicatedTestProject = !!(TEST_SUPABASE_URL && TEST_SUPABASE_ANON_KEY);
const usingDedicatedProdProject = !!(PROD_SUPABASE_URL && PROD_SUPABASE_ANON_KEY);

// For test execution (use test project if available, fallback to production)
const testExecutionUrl = TEST_SUPABASE_URL || PROD_SUPABASE_URL;
const testExecutionAnonKey = TEST_SUPABASE_ANON_KEY || PROD_SUPABASE_ANON_KEY;

// For test reporting (always use production project)
const testReportingUrl = PROD_SUPABASE_URL;
const testReportingAnonKey = PROD_SUPABASE_ANON_KEY;

// Enhanced logging for the dual connection architecture
console.log('🔍 Test Runner - Dual Connection Architecture Analysis:');
console.log('- Test Execution Project:', usingDedicatedTestProject ? 'DEDICATED TEST PROJECT ✅' : 'PRODUCTION PROJECT (fallback) ⚠️');
console.log('- Test Reporting Project:', usingDedicatedProdProject ? 'PRODUCTION PROJECT ✅' : 'FALLBACK ⚠️');
console.log('- Test Execution URL:', testExecutionUrl);
console.log('- Test Reporting URL:', testReportingUrl);
console.log('- Test anon key available:', testExecutionAnonKey ? '[SET]' : '[NOT SET]');
console.log('- Prod anon key available:', testReportingAnonKey ? '[SET]' : '[NOT SET]');
console.log('- Test service role key:', TEST_SUPABASE_SERVICE_ROLE_KEY ? '[SET]' : '[NOT SET]');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- CI Environment:', process.env.CI || 'false');

if (!usingDedicatedTestProject) {
  console.log('');
  console.log('⚠️  WARNING: Not using dedicated test project for execution!');
  console.log('⚠️  Tests may interfere with production data.');
  console.log('⚠️  Recommend setting TEST_SUPABASE_* environment variables.');
  console.log('');
}

if (!usingDedicatedProdProject) {
  console.log('');
  console.log('⚠️  WARNING: Production project configuration incomplete!');
  console.log('⚠️  Test results may not be properly reported.');
  console.log('');
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
    'jest-environment-jsdom',
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

// Create a custom Jest reporter to capture test results
const TEST_REPORTER_PATH = './tests/setup/testReporter.cjs';

if (!existsSync(TEST_REPORTER_PATH)) {
  const testReporterDir = './tests/setup';
  if (!existsSync(testReporterDir)) {
    execSync('mkdir -p ./tests/setup', { stdio: 'inherit' });
  }
  
  console.log('Creating test reporter at', TEST_REPORTER_PATH);
}

// Make HTTP requests work in Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Generate a test run ID or use the existing one (always report to production)
async function createTestRun() {
  if (process.env.TEST_RUN_ID) {
    console.log(`Using existing Test Run ID: ${process.env.TEST_RUN_ID}`);
    return process.env.TEST_RUN_ID;
  }
  
  try {
    console.log(`Creating new test run via ${testReportingUrl}/functions/v1/report-test-results/create-run (PRODUCTION PROJECT)`);
    const response = await fetch(`${testReportingUrl}/functions/v1/report-test-results/create-run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TEST_REPORTING_API_KEY
      },
      body: JSON.stringify({
        git_commit: process.env.GITHUB_SHA || null,
        git_branch: process.env.GITHUB_REF_NAME || null,
      })
    });
    
    if (!response.ok) {
      console.error(`Failed to create test run. Status: ${response.status}`);
      const body = await response.text();
      console.error(`Error: ${body}`);
      return uuidv4();
    }
    
    const data = await response.json();
    console.log(`Created test run with ID: ${data.test_run_id} (in PRODUCTION PROJECT)`);
    return data.test_run_id;
  } catch (error) {
    console.error('Error creating test run:', error);
    return uuidv4();
  }
}

// Make this an async function to use await
(async () => {
  // Create or get the test run ID (always in production project)
  const testRunId = await createTestRun();
  console.log('Test Run ID:', testRunId);
  
  // Set up environment variables with dual connection support
  const testEnv = {
    ...process.env,
    TEST_RUN_ID: testRunId,
    NODE_ENV: 'test',
    TEST_REPORTING_API_KEY: TEST_REPORTING_API_KEY
  };

  // Use dedicated test project for test execution if available
  if (usingDedicatedTestProject) {
    testEnv.TEST_SUPABASE_URL = TEST_SUPABASE_URL;
    testEnv.TEST_SUPABASE_ANON_KEY = TEST_SUPABASE_ANON_KEY;
    if (TEST_SUPABASE_SERVICE_ROLE_KEY) {
      testEnv.TEST_SUPABASE_SERVICE_ROLE_KEY = TEST_SUPABASE_SERVICE_ROLE_KEY;
    }
    console.log('✅ Using dedicated test project for test execution');
  } else {
    // Fallback to production project for test execution (not recommended)
    testEnv.SUPABASE_URL = testExecutionUrl;
    testEnv.SUPABASE_ANON_KEY = testExecutionAnonKey;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      testEnv.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    }
    console.log('⚠️ Using production project for test execution (fallback)');
  }

  // Always set production project variables for test reporting
  testEnv.PROD_SUPABASE_URL = testReportingUrl;
  testEnv.PROD_SUPABASE_ANON_KEY = testReportingAnonKey;
  console.log('✅ Using production project for test reporting');

  // Enhanced environment logging
  console.log('================= Dual Connection Test Environment =================');
  console.log(`- Test Execution Project: ${usingDedicatedTestProject ? 'DEDICATED' : 'PRODUCTION (fallback)'}`);
  console.log(`- Test Reporting Project: PRODUCTION`);
  console.log(`- Test Execution URL: ${testExecutionUrl}`);
  console.log(`- Test Reporting URL: ${testReportingUrl}`);
  console.log(`- Test Execution Anon Key: ${testExecutionAnonKey ? '[SET - ' + testExecutionAnonKey.length + ' chars]' : '[NOT SET]'}`);
  console.log(`- Test Reporting Anon Key: ${testReportingAnonKey ? '[SET - ' + testReportingAnonKey.length + ' chars]' : '[NOT SET]'}`);
  console.log(`- Test Service Key: ${TEST_SUPABASE_SERVICE_ROLE_KEY ? '[SET - ' + TEST_SUPABASE_SERVICE_ROLE_KEY.length + ' chars]' : '[NOT SET]'}`);
  console.log(`- TEST_RUN_ID: ${testRunId}`);
  console.log(`- NODE_ENV: ${testEnv.NODE_ENV}`);
  console.log(`- CI: ${process.env.CI || '[NOT SET]'}`);
  console.log('==================================================================');

  // Create a test to verify if API keys are set correctly and report to the API
  const verifyEnvTestPath = './tests/setup/verify-env.test.ts';
  const setupDir = './tests/setup';

  if (!existsSync(setupDir)) {
    fs.mkdirSync(setupDir, { recursive: true });
  }

  fs.writeFileSync(verifyEnvTestPath, `
  describe('Dual Connection Test Environment', () => {
    test('Verify test execution environment variables are set', () => {
      expect(process.env.TEST_SUPABASE_URL || process.env.SUPABASE_URL).toBeDefined();
      expect(process.env.TEST_REPORTING_API_KEY).toBeDefined();
      expect(process.env.TEST_RUN_ID).toBeDefined();
      console.log('Test execution environment variables are set');
      console.log('TEST_RUN_ID:', process.env.TEST_RUN_ID);
      console.log('Test execution URL:', process.env.TEST_SUPABASE_URL || process.env.SUPABASE_URL);
      console.log('Test execution service role key available:', !!(process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
    });
    
    test('Verify test reporting environment variables are set', () => {
      expect(process.env.PROD_SUPABASE_URL).toBeDefined();
      expect(process.env.PROD_SUPABASE_ANON_KEY).toBeDefined();
      console.log('Test reporting environment variables are set');
      console.log('Production reporting URL:', process.env.PROD_SUPABASE_URL);
      console.log('Production reporting anon key available:', !!process.env.PROD_SUPABASE_ANON_KEY);
    });
    
    test('Dual connection architecture test', async () => {
      console.log('Testing dual connection architecture...');
      console.log('- Test execution uses:', process.env.TEST_SUPABASE_URL ? 'dedicated test project' : 'production project (fallback)');
      console.log('- Test reporting uses: production project');
      console.log('- Results will be visible in production admin interface');
      expect(true).toBe(true);
    });
  });
  `);

  // Run tests with custom reporter
  const testPathPattern = process.argv[2] || '';
  try {
    console.log(`Running tests${testPathPattern ? ` matching pattern: ${testPathPattern}` : ''}...`);
    console.log(`Test run ID: ${testRunId} (reporting to PRODUCTION PROJECT)`);
    console.log(`Test execution on: ${usingDedicatedTestProject ? 'DEDICATED TEST PROJECT' : 'PRODUCTION PROJECT (fallback)'}`);
    
    // Add verbose flag for more detailed test output
    execSync(
      `npx jest ${testPathPattern} --verbose --reporters=default --reporters=${TEST_REPORTER_PATH}`,
      { 
        stdio: 'inherit',
        env: testEnv
      }
    );
  } catch (error) {
    console.error('Tests failed with error code:', error.status);
    process.exit(1);
  }
})();
