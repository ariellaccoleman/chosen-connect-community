
import { EntityRepositoryFactoryBase } from './EntityRepositoryFactoryBase';
import { EntityType } from '@/types/entityTypes';
import { Event } from '@/types/event';
import { EntityRepository } from '../../EntityRepository';

/**
 * Factory for creating event repositories
 */
export class EventRepositoryFactory extends EntityRepositoryFactoryBase<Event> {
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
}

/**
 * Create an event repository factory instance
 */
export function createEventRepositoryFactory(): EventRepositoryFactory {
  return new EventRepositoryFactory();
}

/**
 * Create an event repository
 * 
 * @param options Repository creation options
 * @returns Event repository instance
 */
export function createEventRepository(options: {
  schema?: string;
  initialData?: Event[];
} = {}): EntityRepository<Event> {
  return new EventRepositoryFactory().createRepository(options);
}

/**
 * Create an event repository for testing
 * 
 * @param initialData Optional initial data
 * @returns Event repository instance configured for testing
 */
export function createTestingEventRepository(initialData?: Event[]): EntityRepository<Event> {
  return new EventRepositoryFactory().createTestingRepository(initialData);
}
