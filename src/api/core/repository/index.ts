
/**
 * Repository Pattern Module
 * 
 * This module provides the core repository pattern implementation for creating
 * standardized data access in the application.
 */

// Export the main repository interfaces and types
export * from './DataRepository';
export * from './BaseRepository';
export * from './EntityRepository';
export * from './SupabaseRepository';
export * from './MockRepository';

// Export the repository factories
export * from './repositoryFactory';
export * from './enhancedRepositoryFactory';

// Export utility functions
export * from './repositoryUtils';

// Export standard operations
export * from './standardOperations';
export * from './integrationExamples';
