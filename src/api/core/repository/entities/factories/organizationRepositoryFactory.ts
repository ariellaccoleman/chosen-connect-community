
import { EntityRepositoryFactoryBase } from './EntityRepositoryFactoryBase';
import { EntityType } from '@/types/entityTypes';
import { Organization } from '@/types/organization';
import { EntityRepository } from '../../EntityRepository';

/**
 * Factory for creating organization repositories
 */
export class OrganizationRepositoryFactory extends EntityRepositoryFactoryBase<Organization> {
  /**
   * Get the table name for this entity type
   */
  getTableName(): string {
    return 'organizations';
  }

  /**
   * Get the entity type
   */
  getEntityType(): EntityType {
    return EntityType.ORGANIZATION;
  }

  /**
   * Override createRepository to pass the client through
   */
  createRepository(options: {
    schema?: string;
    initialData?: Organization[];
    client?: any;
  } = {}): EntityRepository<Organization> {
    const baseRepo = this.createBaseRepository(options);
    
    // Import dynamically to avoid circular dependencies
    const { createOrganizationRepository } = require('../OrganizationRepository');
    return createOrganizationRepository(baseRepo, options.client);
  }
}

/**
 * Create an organization repository factory instance
 */
export function createOrganizationRepositoryFactory(): OrganizationRepositoryFactory {
  return new OrganizationRepositoryFactory();
}

/**
 * Create an organization repository
 * 
 * @param options Repository creation options
 * @returns Organization repository instance
 */
export function createOrganizationRepository(options: {
  schema?: string;
  initialData?: Organization[];
  client?: any;
} = {}): EntityRepository<Organization> {
  return new OrganizationRepositoryFactory().createRepository(options);
}

/**
 * Create an organization repository for testing
 * 
 * @param initialData Optional initial data
 * @param client Optional test client
 * @returns Organization repository instance configured for testing
 */
export function createTestingOrganizationRepository(
  initialData?: Organization[], 
  client?: any
): EntityRepository<Organization> {
  return new OrganizationRepositoryFactory().createTestingRepository(initialData, client);
}
