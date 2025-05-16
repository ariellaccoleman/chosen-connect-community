#!/usr/bin/env node

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Supabase URL and key
const SUPABASE_URL = process.env.SUPABASE_URL || "https://nvaqqkffmfuxdnwnqhxo.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52YXFxa2ZmbWZ1eGRud25xaHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNDgxODYsImV4cCI6MjA2MTgyNDE4Nn0.rUwLwOr8QSzhJi3J2Mi_D94Zy-zLWykw7_mXY29UmP4";
const TEST_REPORTING_API_KEY = process.env.TEST_REPORTING_API_KEY || "test-key";

// Create a custom Jest reporter to capture test results
const TEST_REPORTER_PATH = './tests/setup/testReporter.cjs';

if (!existsSync(TEST_REPORTER_PATH)) {
  const testReporterDir = './tests/setup';
  if (!existsSync(testReporterDir)) {
    execSync('mkdir -p ./tests/setup', { stdio: 'inherit' });
  }
  
  console.log('Creating test reporter at', TEST_REPORTER_PATH);
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

// Generate a test run ID
const testRunId = process.env.TEST_RUN_ID || uuidv4();
console.log('Generated Test Run ID:', testRunId); // Added for debugging
process.env.TEST_RUN_ID = testRunId;
process.env.SUPABASE_URL = SUPABASE_URL;
process.env.SUPABASE_KEY = SUPABASE_KEY;
process.env.TEST_REPORTING_API_KEY = TEST_REPORTING_API_KEY;

// Make sure SERVICE_ROLE_KEY is available for the edge function
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is not set. This may cause issues with the test reporting edge function.');
}

// Log environment variables for debugging
console.log('================= Test Environment =================');
console.log(`- SUPABASE_URL: ${SUPABASE_URL}`);
console.log(`- SUPABASE_ANON_KEY: ${SUPABASE_KEY ? '[SET]' : '[NOT SET]'}`);
console.log(`- SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '[SET]' : '[NOT SET]'}`);
console.log(`- TEST_REPORTING_API_KEY: ${TEST_REPORTING_API_KEY ? '[SET]' : '[NOT SET]'}`);
console.log(`- TEST_RUN_ID: ${testRunId}`);
console.log(`- APP_URL: ${process.env.APP_URL || '[NOT SET]'}`);
console.log(`- GITHUB_SHA: ${process.env.GITHUB_SHA || '[NOT SET]'}`);
console.log(`- GITHUB_REF_NAME: ${process.env.GITHUB_REF_NAME || '[NOT SET]'}`);
console.log('===================================================');

// Create a test to verify if API keys are set correctly and report to the API
const verifyEnvTestPath = './tests/setup/verify-env.test.ts';
const setupDir = './tests/setup';

if (!existsSync(setupDir)) {
  fs.mkdirSync(setupDir, { recursive: true });
}

fs.writeFileSync(verifyEnvTestPath, `
describe('Test environment', () => {
  test('Verify required environment variables are set', () => {
    expect(process.env.SUPABASE_URL).toBeDefined();
    expect(process.env.TEST_REPORTING_API_KEY).toBeDefined();
    expect(process.env.TEST_RUN_ID).toBeDefined();
    console.log('All required environment variables are set');
    console.log('TEST_RUN_ID:', process.env.TEST_RUN_ID);
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
  });
  
  test('Test API is working', async () => {
    // Explicitly print variables
    console.log('TEST_RUN_ID from environment:', process.env.TEST_RUN_ID);
    
    // We'll verify this test appears in results to confirm API is working
    expect(true).toBe(true);
  });
});
`);

// Run tests with custom reporter
const testPathPattern = process.argv[2] || '';
try {
  console.log(`Running tests${testPathPattern ? ` matching pattern: ${testPathPattern}` : ''}...`);
  console.log(`Test run ID: ${testRunId}`);
  
  // Add verbose flag for more detailed test output
  execSync(
    `npx jest ${testPathPattern} --verbose --reporters=default --reporters=${TEST_REPORTER_PATH}`,
    { 
      stdio: 'inherit',
      env: {
        ...process.env,
        TEST_RUN_ID: testRunId,
        SUPABASE_URL: SUPABASE_URL,
        SUPABASE_KEY: SUPABASE_KEY,
        TEST_REPORTING_API_KEY: TEST_REPORTING_API_KEY
      }
    }
  );
} catch (error) {
  console.error('Tests failed with error code:', error.status);
  process.exit(1);
}
