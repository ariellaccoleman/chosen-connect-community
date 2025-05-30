
/**
 * Testing utilities - DEPRECATED
 * 
 * Testing utilities have been moved to /tests/api/testing/
 * This file remains for backwards compatibility but will be removed in a future version.
 * 
 * Please update your imports to use:
 * import { CentralTestAuthUtils } from '../../../tests/api/testing/CentralTestAuthUtils';
 */

// Legacy exports (deprecated - use /tests/api/testing/ instead)
export { 
  SecureTestContext,
  createSecureTestContext,
  TestUserFactory as SecureTestUserFactory
} from './secureTestUtils';

// Mock data generation (moved to /tests/api/testing/)
export * from './mockDataGenerator';

// Comprehensive schema validation (for production project)
export * from './comprehensiveSchemaValidation';

// Snapshot testing
export * from './snapshotTesting';

// Validation and performance testing (moved to /tests/api/testing/)
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

// Testing integration guide (documentation)
// Note: TESTING_INTEGRATION_GUIDE.md moved to /tests/docs/
