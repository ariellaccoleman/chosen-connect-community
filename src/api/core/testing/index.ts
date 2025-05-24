
/**
 * Repository Testing Module
 * 
 * This module provides utilities for testing repositories
 */

// Test repository utilities
export * from './repositoryTestUtils';

// Mock data generation
export * from './mockDataGenerator';

// Schema testing and validation (legacy)
export * from './schemaValidationUtils';

// Comprehensive schema validation (new)
export * from './comprehensiveSchemaValidation';

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
  resetSchemaTracking
} from './testSchemaManager';

// Export the SchemaInfo type properly
export type { SchemaInfo } from './testSchemaManager';

// Snapshot testing
export * from './snapshotTesting';

// Validation and performance testing
export * from './validationUtils';

// Relationship testing
export * from './relationshipTesting';

// Schema-based testing utilities
export * from './schemaBasedTesting';

// Infrastructure fixes (new) - export with specific naming to avoid conflicts
export {
  validateSchemaInfrastructure,
  createSchemaWithValidation,
  getTableDDL,
  cleanupSchemaWithValidation,
  compareSchemasDDLWithValidation
} from './schemaInfrastructureFixes';
