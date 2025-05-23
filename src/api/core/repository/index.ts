
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

// Export entity-specific repositories
export * from './entities';

// Export the repository factories without duplicate exports
// We need to avoid re-exporting the EntityRepositoryFactory and createEntityRepository 
// that are already exported from './entities'
export {
  createRepository,
  RepositoryType
} from './repositoryFactory';

export * from './enhancedRepositoryFactory';

// Export utility functions
export * from './repositoryUtils';

// Export standard operations
export * from './standardOperations';
export * from './integrationExamples';
