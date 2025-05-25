
// Setup environment variables for tests
// This file runs before setupTests.ts and ensures environment variables are available

console.log('🔧 Test environment setup starting...');

// Ensure NODE_ENV is set to test
process.env.NODE_ENV = 'test';
console.log('🔧 Set NODE_ENV to:', process.env.NODE_ENV);

// Make sure required Supabase environment variables are available
// These should be set in the CI environment or locally for testing
if (!process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = 'https://nvaqqkffmfuxdnwnqhxo.supabase.co';
  console.log('🔧 Set default SUPABASE_URL');
}

if (!process.env.SUPABASE_ANON_KEY) {
  process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52YXFxa2ZmbWZ1eGRud25xaHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNDgxODYsImV4cCI6MjA2MTgyNDE4Nn0.rUwLwOr8QSzhJi3J2Mi_D94Zy-zLWykw7_mXY29UmP4';
  console.log('🔧 Set default SUPABASE_ANON_KEY');
}

// Enhanced service role key detection and logging
console.log('🔧 Environment variables check:');
console.log('- SUPABASE_URL:', !!process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('- SUPABASE_ANON_KEY:', !!process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
console.log('- TEST_RUN_ID:', !!process.env.TEST_RUN_ID ? 'SET' : 'NOT SET');
console.log('- CI:', process.env.CI || 'NOT SET');
console.log('- GITHUB_ACTIONS:', process.env.GITHUB_ACTIONS || 'NOT SET');

// Check for SUPABASE_SERVICE_ROLE_KEY and log its availability
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('🔧 SUPABASE_SERVICE_ROLE_KEY is available for infrastructure operations');
  console.log('🔧 Service role key length:', process.env.SUPABASE_SERVICE_ROLE_KEY.length);
  console.log('🔧 Service role key starts with:', process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...');
} else {
  console.log('⚠️ SUPABASE_SERVICE_ROLE_KEY not set - infrastructure setup will not work');
  console.log('This is expected in local development but should be available in CI');
  
  // List all environment variables that contain 'SUPABASE' for debugging
  const supabaseVars = Object.keys(process.env).filter(key => key.includes('SUPABASE'));
  console.log('Available SUPABASE environment variables:', supabaseVars);
}

// Security note about testing approach
console.log('🔒 Security Note: Tests now use secure client factory');
console.log('   - Service role key only used for test infrastructure setup');
console.log('   - Application tests use anonymous key to match production behavior');
console.log('   - Authentication tests use proper user sessions');

console.log('🔧 Test environment setup complete');
