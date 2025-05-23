
import { EntityRepositoryFactoryBase } from './EntityRepositoryFactoryBase';
import { EntityType } from '@/types/entityTypes';
import { Profile } from '@/types/profile';
import { EntityRepository } from '../../EntityRepository';

/**
 * Factory for creating profile repositories
 */
export class ProfileRepositoryFactory extends EntityRepositoryFactoryBase<Profile> {
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
}

/**
 * Create a profile repository factory instance
 */
export function createProfileRepositoryFactory(): ProfileRepositoryFactory {
  return new ProfileRepositoryFactory();
}

/**
 * Create a profile repository
 * 
 * @param options Repository creation options
 * @returns Profile repository instance
 */
export function createProfileRepository(options: {
  schema?: string;
  initialData?: Profile[];
} = {}): EntityRepository<Profile> {
  return new ProfileRepositoryFactory().createRepository(options);
}

/**
 * Create a profile repository for testing
 * 
 * @param initialData Optional initial data
 * @returns Profile repository instance configured for testing
 */
export function createTestingProfileRepository(initialData?: Profile[]): EntityRepository<Profile> {
  return new ProfileRepositoryFactory().createTestingRepository(initialData);
}
