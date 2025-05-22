
import { EntityRepositoryFactory } from '../../../repository/enhancedRepositoryFactory';
import { EntityType } from '@/types/entityTypes';
import { Organization } from '@/types/organization';
import { EntityRepository } from '../../../repository/EntityRepository';
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
  ): EntityRepository<Organization> {
    const baseRepository = createEnhancedRepository<Organization>(
      this.getTableName(),
      type,
      initialData,
      {
        idField: 'id',
        defaultSelect: '*',
        enableLogging: process.env.NODE_ENV === 'development'
      }
    );
    
    // Create and return entity repository
    return new EntityRepository<Organization>(
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
