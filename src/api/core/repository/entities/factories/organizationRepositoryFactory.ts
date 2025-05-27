
import { EntityRepositoryFactoryBase } from './EntityRepositoryFactoryBase';
import { EntityType } from '@/types/entityTypes';
import { Organization } from '@/types/organization';
import { EntityRepository } from '../../EntityRepository';
import { createOrganizationRepository } from '../OrganizationRepository';
import { SupabaseRepository } from '../../SupabaseRepository';

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
    // Create the base repository using SupabaseRepository
    const baseRepo = new SupabaseRepository<Organization>(
      this.getTableName(),
      options.schema || 'public',
      options.client
    );
    
    // Create and return the organization repository
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
  const factory = new OrganizationRepositoryFactory();
  return factory.createRepository({ initialData, client });
}
