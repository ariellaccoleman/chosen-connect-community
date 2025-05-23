
// Setup environment variables for tests
// This file runs before setupTests.ts and ensures environment variables are available

// Ensure NODE_ENV is set to test
process.env.NODE_ENV = 'test';

// Make sure required Supabase environment variables are available
// These should be set in the CI environment or locally for testing
if (!process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = 'https://nvaqqkffmfuxdnwnqhxo.supabase.co';
}

if (!process.env.SUPABASE_ANON_KEY) {
  process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52YXFxa2ZmbWZ1eGRud25xaHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNDgxODYsImV4cCI6MjA2MTgyNDE4Nn0.rUwLwOr8QSzhJi3J2Mi_D94Zy-zLWykw7_mXY29UmP4';
}

// SUPABASE_SERVICE_ROLE_KEY should be set in CI environment
// Log a warning if it's not available but don't set a default for security
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('🔧 SUPABASE_SERVICE_ROLE_KEY not set - some tests may use anon key fallback');
}
