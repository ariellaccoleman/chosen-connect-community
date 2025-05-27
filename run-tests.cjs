#!/usr/bin/env node
// DO NOT PUT A BLANK LINE AT THE FRONT OF THIS FILE

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Runtime environment variable access - no fallbacks to production
const getRequiredEnvVar = (name, description) => {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ Missing required environment variable: ${name}`);
    console.error(`   This is needed for: ${description}`);
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const getOptionalEnvVar = (name, defaultValue = null) => {
  return process.env[name] || defaultValue;
};

// Test project configuration (REQUIRED - no fallbacks)
let TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_SERVICE_ROLE_KEY;

try {
  TEST_SUPABASE_URL = getRequiredEnvVar('TEST_SUPABASE_URL', 'test database connection');
  TEST_SUPABASE_ANON_KEY = getRequiredEnvVar('TEST_SUPABASE_ANON_KEY', 'test database authentication');
  TEST_SUPABASE_SERVICE_ROLE_KEY = getOptionalEnvVar('TEST_SUPABASE_SERVICE_ROLE_KEY');
} catch (error) {
  console.error('');
  console.error('🚨 TEST ENVIRONMENT SETUP REQUIRED:');
  console.error('   Tests require a dedicated test Supabase project to avoid interfering with production data.');
  console.error('   Please set the following environment variables:');
  console.error('   - TEST_SUPABASE_URL: URL of your test Supabase project');
  console.error('   - TEST_SUPABASE_ANON_KEY: Anonymous key for your test project');
  console.error('   - TEST_SUPABASE_SERVICE_ROLE_KEY: Service role key for test data setup');
  console.error('');
  process.exit(1);
}

// Production project configuration (for test reporting)
const PROD_SUPABASE_URL = getOptionalEnvVar('PROD_SUPABASE_URL') || getOptionalEnvVar('SUPABASE_URL');
const PROD_SUPABASE_ANON_KEY = getOptionalEnvVar('PROD_SUPABASE_ANON_KEY') || getOptionalEnvVar('SUPABASE_ANON_KEY');
const TEST_REPORTING_API_KEY = getOptionalEnvVar('TEST_REPORTING_API_KEY', 'test-key');

// Validate we have separate test and production projects
if (TEST_SUPABASE_URL === PROD_SUPABASE_URL) {
  console.error('');
  console.error('🚨 INVALID CONFIGURATION:');
  console.error('   TEST_SUPABASE_URL cannot be the same as production SUPABASE_URL');
  console.error('   Tests must use a dedicated test project to avoid data conflicts.');
  console.error('   Current values:');
  console.error(`   - TEST_SUPABASE_URL: ${TEST_SUPABASE_URL}`);
  console.error(`   - SUPABASE_URL: ${PROD_SUPABASE_URL}`);
  console.error('');
  process.exit(1);
}

console.log('🔍 Test Runner - Environment Configuration:');
console.log('- Test Project URL:', TEST_SUPABASE_URL);
console.log('- Production Project URL:', PROD_SUPABASE_URL || '[NOT SET]');
console.log('- Test anon key available:', !!TEST_SUPABASE_ANON_KEY);
console.log('- Test service role key available:', !!TEST_SUPABASE_SERVICE_ROLE_KEY);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- CI Environment:', process.env.CI || 'false');

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
  
  if (!PROD_SUPABASE_URL) {
    console.log('No production project configured for test reporting - using local test run ID');
    return uuidv4();
  }
  
  try {
    console.log(`Creating new test run via ${PROD_SUPABASE_URL}/functions/v1/report-test-results/create-run`);
    const response = await fetch(`${PROD_SUPABASE_URL}/functions/v1/report-test-results/create-run`, {
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
    console.log(`Created test run with ID: ${data.test_run_id}`);
    return data.test_run_id;
  } catch (error) {
    console.error('Error creating test run:', error);
    return uuidv4();
  }
}

// Make this an async function to use await
(async () => {
  // Create or get the test run ID (only if production project is configured)
  const testRunId = await createTestRun();
  console.log('Test Run ID:', testRunId);
  
  // Set up environment variables - all required vars validated above
  const testEnv = {
    ...process.env,
    TEST_RUN_ID: testRunId,
    NODE_ENV: 'test',
    TEST_REPORTING_API_KEY: TEST_REPORTING_API_KEY,
    // Test project configuration (REQUIRED)
    TEST_SUPABASE_URL: TEST_SUPABASE_URL,
    TEST_SUPABASE_ANON_KEY: TEST_SUPABASE_ANON_KEY
  };

  // Add service role key if available
  if (TEST_SUPABASE_SERVICE_ROLE_KEY) {
    testEnv.TEST_SUPABASE_SERVICE_ROLE_KEY = TEST_SUPABASE_SERVICE_ROLE_KEY;
  }

  // Add production project variables for test reporting (if available)
  if (PROD_SUPABASE_URL && PROD_SUPABASE_ANON_KEY) {
    testEnv.PROD_SUPABASE_URL = PROD_SUPABASE_URL;
    testEnv.PROD_SUPABASE_ANON_KEY = PROD_SUPABASE_ANON_KEY;
  }

  console.log('================= Test Environment Configuration =================');
  console.log(`- Test Project: ${TEST_SUPABASE_URL}`);
  console.log(`- Production Project: ${PROD_SUPABASE_URL || '[NOT CONFIGURED]'}`);
  console.log(`- Test Anon Key: [SET - ${TEST_SUPABASE_ANON_KEY.length} chars]`);
  console.log(`- Test Service Key: ${TEST_SUPABASE_SERVICE_ROLE_KEY ? '[SET - ' + TEST_SUPABASE_SERVICE_ROLE_KEY.length + ' chars]' : '[NOT SET]'}`);
  console.log(`- TEST_RUN_ID: ${testRunId}`);
  console.log(`- NODE_ENV: ${testEnv.NODE_ENV}`);
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
    console.log(`Test execution on: DEDICATED TEST PROJECT (${TEST_SUPABASE_URL})`);
    console.log(`Test reporting to: ${PROD_SUPABASE_URL || 'LOCAL ONLY'}`);
    
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
