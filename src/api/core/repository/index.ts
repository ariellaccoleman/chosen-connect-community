
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

// Export entity-specific repositories from entities folder
// But exclude the factory exports that would conflict
export * from './entities/ProfileRepository';
export * from './entities/OrganizationRepository'; 
export * from './entities/EventRepository';
export * from './entities/HubRepository';

// Export the factories folder separately to avoid conflicts
export * from './entities/factories/profileRepositoryFactory';
export * from './entities/factories/organizationRepositoryFactory';
export * from './entities/factories/eventRepositoryFactory'; 
export * from './entities/factories/hubRepositoryFactory';

// Export from repositoryFactory directly
export {
  createRepository,
  createTestingRepository,
  // Remove the type export that doesn't exist
} from './repositoryFactory';

export * from './enhancedRepositoryFactory';

// Export utility functions
export * from './repositoryUtils';

// Export standard operations
export * from './standardOperations';
export * from './integrationExamples';

// Export caching functionality
export * from './cache';

// Export all operations
export * from './operations';
