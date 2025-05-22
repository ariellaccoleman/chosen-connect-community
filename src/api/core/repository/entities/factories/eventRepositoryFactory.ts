
import { EntityRepositoryFactory } from '../../../repository/enhancedRepositoryFactory';
import { EntityType } from '@/types/entityTypes';
import { Event } from '@/types/event';
import { EventRepository } from '../EventRepository';
import { createEnhancedRepository, EnhancedRepositoryType } from '../../../repository/enhancedRepositoryFactory';

/**
 * Factory for creating event repositories
 */
export class EventRepositoryFactory extends EntityRepositoryFactory<Event> {
  /**
   * Get the table name for this entity type
   */
  getTableName(): string {
    return 'events';
  }

  /**
   * Get the entity type
   */
  getEntityType(): EntityType {
    return EntityType.EVENT;
  }

  /**
   * Create a repository instance
   */
  createRepository(
    type: EnhancedRepositoryType = 'supabase',
    initialData?: Event[]
  ): EventRepository {
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
    
    // Create and return event repository with the entity-specific implementation
    return new EventRepository(
      this.getTableName(),
      this.getEntityType(),
      baseRepository
    );
  }
}

/**
 * Create an event repository factory instance
 */
export function createEventRepositoryFactory(): EventRepositoryFactory {
  return new EventRepositoryFactory();
}
