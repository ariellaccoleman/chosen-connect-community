
// Simplified environment setup for dedicated test project
console.log('🔧 Test environment setup starting...');

// Enhanced environment detection function
function isTestEnvironment() {
  const checks = {
    NODE_ENV: process.env.NODE_ENV === 'test',
    JEST_WORKER_ID: typeof process.env.JEST_WORKER_ID !== 'undefined',
    TEST_RUN_ID: typeof process.env.TEST_RUN_ID !== 'undefined',
    CI: process.env.CI === 'true',
    GITHUB_ACTIONS: process.env.GITHUB_ACTIONS === 'true'
  };
  
  console.log('🔍 Environment Detection Results:');
  Object.entries(checks).forEach(([key, value]) => {
    console.log(`   ${key}: ${value ? '✅' : '❌'}`);
  });
  
  return Object.values(checks).some(check => check);
}

// Ensure NODE_ENV is set to test
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
  console.log('🔧 Set NODE_ENV to: test (was not set)');
} else {
  console.log('🔧 NODE_ENV already set to:', process.env.NODE_ENV);
}

// Run environment detection
const isTest = isTestEnvironment();
console.log('🔧 Test environment detected:', isTest ? '✅ YES' : '⚠️ NO');

// Test project configuration (primary)
if (!process.env.TEST_SUPABASE_URL) {
  console.log('🔧 TEST_SUPABASE_URL not set - using fallback');
}

if (!process.env.TEST_SUPABASE_ANON_KEY) {
  console.log('🔧 TEST_SUPABASE_ANON_KEY not set - using fallback');
}

// Enhanced environment logging
console.log('🔧 Environment variables check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- CI:', process.env.CI || 'NOT SET');
console.log('- GITHUB_ACTIONS:', process.env.GITHUB_ACTIONS || 'NOT SET');
console.log('- TEST_SUPABASE_URL:', !!process.env.TEST_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('- TEST_SUPABASE_ANON_KEY:', !!process.env.TEST_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('- TEST_SUPABASE_SERVICE_ROLE_KEY:', !!process.env.TEST_SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
console.log('- TEST_RUN_ID:', !!process.env.TEST_RUN_ID ? 'SET' : 'NOT SET');
console.log('- JEST_WORKER_ID:', !!process.env.JEST_WORKER_ID ? 'SET' : 'NOT SET');

// Check for dedicated test project setup
const usingDedicatedProject = process.env.TEST_SUPABASE_URL && 
                             process.env.TEST_SUPABASE_URL !== process.env.SUPABASE_URL;

if (usingDedicatedProject) {
  console.log('✅ Using dedicated test Supabase project');
  console.log('✅ Test project URL:', process.env.TEST_SUPABASE_URL);
} else {
  console.log('⚠️ Not using dedicated test project - this may cause issues');
  console.log('⚠️ Recommend setting up TEST_SUPABASE_* environment variables');
}

// Check for service role key availability
if (process.env.TEST_SUPABASE_SERVICE_ROLE_KEY) {
  console.log('✅ TEST_SUPABASE_SERVICE_ROLE_KEY is available for test setup');
  console.log('✅ Service role key length:', process.env.TEST_SUPABASE_SERVICE_ROLE_KEY.length);
} else {
  console.log('⚠️ TEST_SUPABASE_SERVICE_ROLE_KEY not set - some tests may fail');
  console.log('This is required for user creation and data cleanup in tests');
}

// Security note about the new testing approach
console.log('🔒 New Testing Architecture:');
console.log('   - Using dedicated test Supabase project for complete isolation');
console.log('   - No more complex schema manipulation or workarounds');
console.log('   - Service role key safe to use since it\'s a separate test project');
console.log('   - Clean setup and teardown with real database behavior');

if (isTest) {
  console.log('🔧 Test environment setup complete - environment detection successful');
} else {
  console.log('⚠️ Test environment setup complete - but environment detection failed');
  console.log('⚠️ Tests may still work but please verify environment variables');
}
