
/**
 * Repository Testing Module
 * 
 * This module provides utilities for testing repositories with enhanced security
 */

// Secure test utilities (recommended)
export * from './secureTestUtils';

// Legacy test repository utilities (deprecated - use secureTestUtils instead)
export * from './repositoryTestUtils';

// Mock data generation
export * from './mockDataGenerator';

// Schema testing and validation (legacy) - explicit exports to avoid conflicts
export {
  validateSchemaReplication,
  runSchemaValidationTest,
  compareSchemasDDL
} from './schemaValidationUtils';

// Comprehensive schema validation (new)
export * from './comprehensiveSchemaValidation';

// Test schema management (legacy - use TestInfrastructure from testClient instead)
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

// Schema-based testing utilities (legacy - migrated to secure utilities)
export * from './schemaBasedTesting';

// Infrastructure fixes (new) - export with specific naming to avoid conflicts
export {
  validateSchemaInfrastructure,
  createSchemaWithValidation,
  getTableDDL,
  cleanupSchemaWithValidation,
  compareSchemasDDLWithValidation
} from './schemaInfrastructureFixes';
