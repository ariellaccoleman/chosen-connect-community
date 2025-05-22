
import { EntityRepositoryFactory } from '../../../repository/enhancedRepositoryFactory';
import { EntityType } from '@/types/entityTypes';
import { Profile } from '@/types/profile';
import { ProfileRepository } from '../ProfileRepository';
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
  ): ProfileRepository {
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
    
    // Create and return profile repository with the entity-specific implementation
    return new ProfileRepository(
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
