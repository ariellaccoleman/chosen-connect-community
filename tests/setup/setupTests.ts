
import '@testing-library/jest-dom';

// Ensure service role key is available for schema operations in tests
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not set - schema-based tests may fail');
  console.warn('Set this environment variable to enable full database testing');
}

// Set NODE_ENV to test if not already set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

// Global test timeout for database operations
jest.setTimeout(30000);

// Clean up any global state after each test
afterEach(() => {
  // Reset any global state if needed
  jest.clearAllMocks();
});

// Global error handler for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
