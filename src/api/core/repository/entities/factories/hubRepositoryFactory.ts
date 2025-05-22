
import { HubRepository } from '../HubRepository';
import { EntityRepositoryFactory } from '../../enhancedRepositoryFactory';
import { Hub } from '@/types/hub';
import { EntityType } from '@/types/entityTypes';

/**
 * Factory for creating hub repositories
 */
export class HubRepositoryFactory extends EntityRepositoryFactory<Hub> {
  /**
   * Get the table name for hubs
   */
  getTableName(): string {
    return 'hubs';
  }
  
  /**
   * Get the entity type for hubs
   */
  getEntityType(): EntityType {
    return EntityType.HUB;
  }
  
  /**
   * Create a hub repository
   */
  createRepository(type: 'supabase' | 'mock', initialData?: Hub[]): HubRepository {
    const repository = new HubRepository();
    // Additional setup can happen here
    return repository;
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
 * Convenience function for creating a hub repository directly
 */
export function createHubRepository(type: 'supabase' | 'mock' = 'supabase', initialData?: Hub[]): HubRepository {
  return createHubRepositoryFactory().createRepository(type, initialData);
}

