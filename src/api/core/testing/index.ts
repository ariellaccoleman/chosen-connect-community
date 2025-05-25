
/**
 * Repository Testing Module
 * 
 * This module provides utilities for testing repositories with the new
 * simplified architecture using a dedicated test Supabase project
 */

// NEW: Simplified test utilities for dedicated test project (recommended)
export * from './simplifiedTestUtils';

// Secure test utilities (still available) - but rename TestUserFactory to avoid conflict
export { 
  SecureTestContext,
  createSecureTestContext,
  TestUserFactory as SecureTestUserFactory
} from './secureTestUtils';

// Legacy test repository utilities (deprecated)
export * from './repositoryTestUtils';

// Mock data generation
export * from './mockDataGenerator';

// Comprehensive schema validation (for production project)
export * from './comprehensiveSchemaValidation';

// Snapshot testing
export * from './snapshotTesting';

// Validation and performance testing
export * from './validationUtils';

// Relationship testing
export * from './relationshipTesting';

// Schema-based testing utilities (legacy - use simplified utils instead)
export * from './schemaBasedTesting';

// Infrastructure fixes (legacy - not needed with dedicated test project)
export {
  validateSchemaInfrastructure,
  createSchemaWithValidation,
  getTableDDL,
  cleanupSchemaWithValidation,
  compareSchemasDDLWithValidation
} from './schemaInfrastructureFixes';

// Error types for enhanced error handling
export * from './errorTypes';
