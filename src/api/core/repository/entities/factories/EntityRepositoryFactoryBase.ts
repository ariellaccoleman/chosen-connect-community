
import { BaseRepository } from '../../BaseRepository';
import { EntityRepository } from '../../EntityRepository';
import { Entity } from '@/types/entity';
import { EntityType } from '@/types/entityTypes';
import { createRepository } from '../../repositoryFactory';

/**
 * Base class for entity repository factories
 */
export abstract class EntityRepositoryFactoryBase<T extends Entity> {
  /**
   * Get the table name for this entity type
   */
  abstract getTableName(): string;

  /**
   * Get the entity type
   */
  abstract getEntityType(): EntityType;

  /**
   * Create a repository instance using the appropriate schema
   * 
   * @param options Repository creation options
   * @returns Entity repository instance
   */
  createRepository(options: {
    schema?: string;
    initialData?: T[];
    enableLogging?: boolean;
  } = {}): EntityRepository<T> {
    const { schema = 'public', initialData, enableLogging = process.env.NODE_ENV === 'development' } = options;
    
    // Create a base repository with the specified schema
    const baseRepository = createRepository<T>(
      this.getTableName(),
      { 
        schema,
        enableLogging
      }
    );
    
    // Create and return entity repository
    return new EntityRepository<T>(
      this.getTableName(),
      this.getEntityType(),
      baseRepository
    );
  }

  /**
   * Create a repository for testing
   * 
   * @param initialData Optional initial data to seed the repository
   * @returns Entity repository instance configured for testing
   */
  createTestingRepository(initialData?: T[]): EntityRepository<T> {
    return this.createRepository({
      schema: 'testing',
      initialData,
      enableLogging: true
    });
  }
}
