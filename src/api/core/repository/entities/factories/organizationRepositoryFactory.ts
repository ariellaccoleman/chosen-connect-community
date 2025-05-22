
import { OrganizationRepository } from '../OrganizationRepository';
import { EntityRepositoryFactory } from '../../enhancedRepositoryFactory';
import { Organization } from '@/types/organization';
import { EntityType } from '@/types/entityTypes';

/**
 * Factory for creating organization repositories
 */
export class OrganizationRepositoryFactory extends EntityRepositoryFactory<Organization> {
  /**
   * Get the table name for organizations
   */
  getTableName(): string {
    return 'organizations';
  }
  
  /**
   * Get the entity type for organizations
   */
  getEntityType(): EntityType {
    return EntityType.ORGANIZATION;
  }
  
  /**
   * Create an organization repository
   */
  createRepository(type: 'supabase' | 'mock', initialData?: Organization[]): OrganizationRepository {
    const repository = new OrganizationRepository();
    // Additional setup can happen here
    return repository;
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
 * Convenience function for creating an organization repository directly
 */
export function createOrganizationRepository(type: 'supabase' | 'mock' = 'supabase', initialData?: Organization[]): OrganizationRepository {
  return createOrganizationRepositoryFactory().createRepository(type, initialData);
}

