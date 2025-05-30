
/**
 * Testing utilities index
 * Centralized exports for all testing utilities
 */

// Main testing utility
export { CentralTestAuthUtils } from './CentralTestAuthUtils';

// API registry for dynamic testing
export { testApiRegistry, TestApiRegistry } from './TestApiRegistry';
export type { ApiRegistryEntry, ApiResetFunction } from './TestApiRegistry';

// Mock data generation
export * from './mockDataGenerator';

// Validation utilities
export * from './validationUtils';

// Database testing utilities
export * from './databaseTestUtils';

// Legacy test utilities (for backwards compatibility)
export * from '../utils/testAuthUtils';
export * from '../utils/persistentTestUsers';
