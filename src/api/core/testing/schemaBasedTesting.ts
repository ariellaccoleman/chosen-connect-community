
/**
 * Schema-Based Testing - Main entry point
 * This file serves as the main entry point and maintains backward compatibility
 */

// Re-export all functionality from the new modules
export * from './schemaManager';
export * from './schemaValidator';
export * from './testContextManager';

// Import the TestClientFactory for compatibility
export { TestClientFactory } from '@/integrations/supabase/testClient';

// Re-export repository test utils for completeness
export * from './repositoryTestUtils';
