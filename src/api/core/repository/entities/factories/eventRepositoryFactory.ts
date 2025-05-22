
import { EventRepository } from '../EventRepository';
import { EntityRepositoryFactory } from '../../enhancedRepositoryFactory';
import { Event } from '@/types/event';
import { EntityType } from '@/types/entityTypes';

/**
 * Factory for creating event repositories
 */
export class EventRepositoryFactory extends EntityRepositoryFactory<Event> {
  /**
   * Get the table name for events
   */
  getTableName(): string {
    return 'events';
  }
  
  /**
   * Get the entity type for events
   */
  getEntityType(): EntityType {
    return EntityType.EVENT;
  }
  
  /**
   * Create an event repository
   */
  createRepository(type: 'supabase' | 'mock', initialData?: Event[]): EventRepository {
    const repository = new EventRepository();
    // Additional setup can happen here
    return repository;
  }
}

/**
 * Create an event repository factory instance
 */
export function createEventRepositoryFactory(): EventRepositoryFactory {
  return new EventRepositoryFactory();
}

/**
 * Create an event repository
 * Convenience function for creating an event repository directly
 */
export function createEventRepository(type: 'supabase' | 'mock' = 'supabase', initialData?: Event[]): EventRepository {
  return createEventRepositoryFactory().createRepository(type, initialData);
}

