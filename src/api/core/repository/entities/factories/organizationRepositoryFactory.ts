
import { EntityRepositoryFactory } from '../../../repository/enhancedRepositoryFactory';
import { EntityType } from '@/types/entityTypes';
import { Organization } from '@/types/organization';
import { OrganizationRepository } from '../OrganizationRepository';
import { createEnhancedRepository, EnhancedRepositoryType } from '../../../repository/enhancedRepositoryFactory';

/**
 * Factory for creating organization repositories
 */
export class OrganizationRepositoryFactory extends EntityRepositoryFactory<Organization> {
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
   * Create a repository instance
   */
  createRepository(
    type: EnhancedRepositoryType = 'supabase',
    initialData?: Organization[]
  ): OrganizationRepository {
    const baseRepository = createEnhancedRepository<any>(
      this.getTableName(),
      type,
      initialData,
      {
        idField: 'id',
        defaultSelect: '*',
        enableLogging: process.env.NODE_ENV === 'development'
      }
    );
    
    // Create and return organization repository with the entity-specific implementation
    return new OrganizationRepository(
      this.getTableName(),
      this.getEntityType(),
      baseRepository
    );
  }
}

/**
 * Create an organization repository factory instance
 */
export function createOrganizationRepositoryFactory(): OrganizationRepositoryFactory {
  return new OrganizationRepositoryFactory();
}
