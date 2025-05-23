
import { EntityRepositoryFactoryBase } from './EntityRepositoryFactoryBase';
import { EntityType } from '@/types/entityTypes';
import { Hub } from '@/types/hub';
import { EntityRepository } from '../../EntityRepository';

/**
 * Factory for creating hub repositories
 */
export class HubRepositoryFactory extends EntityRepositoryFactoryBase<Hub> {
  /**
   * Get the table name for this entity type
   */
  getTableName(): string {
    return 'hubs';
  }

  /**
   * Get the entity type
   */
  getEntityType(): EntityType {
    return EntityType.HUB;
  }
}

/**
 * Create a hub repository factory instance
 */
export function createHubRepositoryFactory(): HubRepositoryFactory {
  return new HubRepositoryFactory();
}

/**
 * Create a hub repository
 * 
 * @param options Repository creation options
 * @returns Hub repository instance
 */
export function createHubRepository(options: {
  schema?: string;
  initialData?: Hub[];
} = {}): EntityRepository<Hub> {
  return new HubRepositoryFactory().createRepository(options);
}

/**
 * Create a hub repository for testing
 * 
 * @param initialData Optional initial data
 * @returns Hub repository instance configured for testing
 */
export function createTestingHubRepository(initialData?: Hub[]): EntityRepository<Hub> {
  return new HubRepositoryFactory().createTestingRepository(initialData);
}
