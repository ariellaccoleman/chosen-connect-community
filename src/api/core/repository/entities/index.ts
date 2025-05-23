
/**
 * Entity repositories module
 * 
 * This module exports specialized repositories for different entity types
 */

// Export entity repositories
export * from './ProfileRepository';
export * from './OrganizationRepository'; 
export * from './EventRepository';
export * from './HubRepository';

// Export factory functions but rename them to avoid conflicts
export {
  // Export from factories but with clear namespacing
  createProfileRepositoryFactory,
  createTestingProfileRepository as createFactoryTestingProfileRepository,
  createProfileRepository as createFactoryProfileRepository
} from './factories/profileRepositoryFactory';

export {
  createOrganizationRepositoryFactory,
  createTestingOrganizationRepository as createFactoryTestingOrganizationRepository,
  createOrganizationRepository as createFactoryOrganizationRepository
} from './factories/organizationRepositoryFactory';

export {
  createEventRepositoryFactory,
  createTestingEventRepository as createFactoryTestingEventRepository,
  createEventRepository as createFactoryEventRepository
} from './factories/eventRepositoryFactory';

export {
  createHubRepositoryFactory,
  createTestingHubRepository as createFactoryTestingHubRepository,
  createHubRepository as createFactoryHubRepository
} from './factories/hubRepositoryFactory';

// Export the base factory class
export * from './factories/EntityRepositoryFactoryBase';

// Export entity repository base class
export * from '../EntityRepository';
