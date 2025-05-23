
/**
 * Repository Testing Module
 * 
 * This module provides utilities for testing repositories
 */

// Test repository utilities
export * from './repositoryTestUtils';

// Mock data generation
export * from './mockDataGenerator';

// Schema testing and validation
export * from './schemaValidationUtils';

// Test schema management
export {
  createTestSchema, 
  validateTestSchema,
  schemaExists, 
  releaseSchema,
  addTestUser,
  dropSchema,
  cleanupReleasedSchemas,
  getActiveSchemas,
  resetSchemaTracking,
  SchemaInfo
} from './testSchemaManager';

// Snapshot testing
export * from './snapshotTesting';

// Validation and performance testing
export * from './validationUtils';

// Relationship testing
export * from './relationshipTesting';

// Schema-based testing utilities
export * from './schemaBasedTesting';

// Legacy re-export has been removed as it was pointing to an invalid path
// If you need test data utilities, use the direct import from src/utils/testData instead
