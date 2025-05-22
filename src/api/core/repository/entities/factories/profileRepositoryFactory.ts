
import { EntityRepositoryFactory } from '../../../repository/enhancedRepositoryFactory';
import { EntityType } from '@/types/entityTypes';
import { Profile } from '@/types/profile';
import { EntityRepository } from '../../../repository/EntityRepository';
import { createEnhancedRepository, EnhancedRepositoryType } from '../../../repository/enhancedRepositoryFactory';

/**
 * Factory for creating profile repositories
 */
export class ProfileRepositoryFactory extends EntityRepositoryFactory<Profile> {
  /**
   * Get the table name for this entity type
   */
  getTableName(): string {
    return 'profiles';
  }

  /**
   * Get the entity type
   */
  getEntityType(): EntityType {
    return EntityType.PERSON;
  }

  /**
   * Create a repository instance
   */
  createRepository(
    type: EnhancedRepositoryType = 'supabase',
    initialData?: Profile[]
  ): EntityRepository<Profile> {
    const baseRepository = createEnhancedRepository<Profile>(
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
    return new EntityRepository<Profile>(
      this.getTableName(),
      this.getEntityType(),
      baseRepository
    );
  }
}

/**
 * Create a profile repository factory instance
 */
export function createProfileRepositoryFactory(): ProfileRepositoryFactory {
  return new ProfileRepositoryFactory();
}
