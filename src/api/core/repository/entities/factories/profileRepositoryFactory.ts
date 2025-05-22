
import { ProfileRepository } from '../ProfileRepository';
import { EntityRepositoryFactory } from '../../enhancedRepositoryFactory';
import { Profile } from '@/types/profile';
import { EntityType } from '@/types/entityTypes';

/**
 * Factory for creating profile repositories
 */
export class ProfileRepositoryFactory extends EntityRepositoryFactory<Profile> {
  /**
   * Get the table name for profiles
   */
  getTableName(): string {
    return 'profiles';
  }
  
  /**
   * Get the entity type for profiles
   */
  getEntityType(): EntityType {
    return EntityType.PERSON;
  }
  
  /**
   * Create a profile repository
   */
  createRepository(type: 'supabase' | 'mock', initialData?: Profile[]): ProfileRepository {
    const repository = new ProfileRepository();
    // Additional setup can happen here
    return repository;
  }
}

/**
 * Create a profile repository factory instance
 */
export function createProfileRepositoryFactory(): ProfileRepositoryFactory {
  return new ProfileRepositoryFactory();
}

/**
 * Create a profile repository
 * Convenience function for creating a profile repository directly
 */
export function createProfileRepository(type: 'supabase' | 'mock' = 'supabase', initialData?: Profile[]): ProfileRepository {
  return createProfileRepositoryFactory().createRepository(type, initialData);
}

