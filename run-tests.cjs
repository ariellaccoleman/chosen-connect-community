
#!/usr/bin/env node

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { v4: uuidv4 } = require('uuid');

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
  
  // Creating the test reporter will be handled by the AI through lov-write
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
const testRunId = uuidv4();
process.env.TEST_RUN_ID = testRunId;
process.env.SUPABASE_URL = SUPABASE_URL;
process.env.SUPABASE_KEY = SUPABASE_KEY;
process.env.TEST_REPORTING_API_KEY = TEST_REPORTING_API_KEY;

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
        SUPABASE_KEY: SUPABASE_KEY,
        TEST_REPORTING_API_KEY: TEST_REPORTING_API_KEY
      }
    }
  );
} catch (error) {
  console.error('Tests failed with error code:', error.status);
  process.exit(1);
}
