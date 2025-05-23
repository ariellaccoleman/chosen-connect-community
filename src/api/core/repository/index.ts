
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
export * from './entities/ProfileRepository';
export * from './entities/OrganizationRepository'; 
export * from './entities/EventRepository';
export * from './entities/HubRepository';

// Export the factory functions with explicit naming
export {
  createProfileRepositoryFactory,
  createProfileRepository,
  createTestingProfileRepository
} from './entities/factories/profileRepositoryFactory';

export {
  createOrganizationRepositoryFactory,
  createOrganizationRepository,
  createTestingOrganizationRepository
} from './entities/factories/organizationRepositoryFactory';

export {
  createEventRepositoryFactory,
  createEventRepository,
  createTestingEventRepository
} from './entities/factories/eventRepositoryFactory';

export {
  createHubRepositoryFactory, 
  createHubRepository,
  createTestingHubRepository
} from './entities/factories/hubRepositoryFactory';

// Export entity repository factory base class
export type { EntityRepositoryFactoryBase } from './entities/factories/EntityRepositoryFactoryBase';

// Export entity repository factory with explicit renaming to avoid conflicts
export { 
  EntityRepositoryFactory as GenericEntityRepositoryFactory,
  createEntityRepository as createGenericEntityRepository,
  createTestingEntityRepository as createGenericTestingEntityRepository
} from './entities/factories/entityRepositoryFactory';

// Export from repositoryFactory directly
export {
  createRepository,
  createTestingRepository,
  RepositoryOptions
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
