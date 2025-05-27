
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
} = {}): EntityRepository<Organization> {
  return new OrganizationRepositoryFactory().createRepository(options);
}

/**
 * Create an organization repository for testing
 * 
 * @param initialData Optional initial data
 * @returns Organization repository instance configured for testing
 */
export function createTestingOrganizationRepository(initialData?: Organization[]): EntityRepository<Organization> {
  return new OrganizationRepositoryFactory().createTestingRepository(initialData);
}
