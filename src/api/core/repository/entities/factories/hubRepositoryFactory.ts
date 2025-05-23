
import { EntityRepositoryFactory } from '../../../repository/enhancedRepositoryFactory';
import { EntityType } from '@/types/entityTypes';
import { Hub } from '@/types/hub';
import { EntityRepository } from '../../../repository/EntityRepository';
import { createEnhancedRepository, EnhancedRepositoryType } from '../../../repository/enhancedRepositoryFactory';

/**
 * Factory for creating hub repositories
 */
export class HubRepositoryFactory extends EntityRepositoryFactory<Hub> {
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

  /**
   * Create a repository instance
   */
  createRepository(
    type: EnhancedRepositoryType = 'supabase',
    initialData?: Hub[]
  ): EntityRepository<Hub> {
    const baseRepository = createEnhancedRepository<Hub>(
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
    return new EntityRepository<Hub>(
      this.getTableName(),
      this.getEntityType(),
      baseRepository
    );
  }
}

/**
 * Create a hub repository factory instance
 */
export function createHubRepositoryFactory(): HubRepositoryFactory {
  return new HubRepositoryFactory();
}
