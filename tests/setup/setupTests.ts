
import '@testing-library/jest-dom';
import { setupTestingSchema, cleanTestData } from './setupTestSchema';

// Set environment variables for tests
process.env.SUPABASE_SCHEMA = 'testing';

// Global setup before running tests
beforeAll(async () => {
  try {
    // Set up testing schema
    await setupTestingSchema();
    console.log('Testing schema setup completed');
  } catch (error) {
    console.error('Error during test schema setup:', error);
  }
});

// Clean up after all tests
afterAll(async () => {
  try {
    // Clean test data
    await cleanTestData();
    console.log('Test data cleanup completed');
  } catch (error) {
    console.error('Error during test data cleanup:', error);
  }
});
