
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

// Comprehensive schema validation (new)
export * from './comprehensiveSchemaValidation';

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

// Error types for enhanced error handling
export * from './errorTypes';
