
import { EntityRepositoryFactoryBase } from './EntityRepositoryFactoryBase';
import { BaseRepository } from '../../BaseRepository';
import { EntityRepository } from '../../EntityRepository';
import { Entity } from '@/types/entity';
import { EntityType } from '@/types/entityTypes';

import { createProfileRepository } from './profileRepositoryFactory';
import { createOrganizationRepository } from './organizationRepositoryFactory';
import { createEventRepository } from './eventRepositoryFactory';
import { createHubRepository } from './hubRepositoryFactory';

/**
 * Factory for creating entity repositories
 */
export class EntityRepositoryFactory {
  /**
   * Create an entity repository for the specified type
   * 
   * @param entityType Type of entity to create repository for
   * @param options Repository creation options
   * @returns Entity repository
   */
  static createRepository<T extends Entity>(
    entityType: EntityType,
    options: {
      schema?: string;
      initialData?: T[];
      enableLogging?: boolean;
    } = {}
  ): EntityRepository<T> {
    switch (entityType) {
      case EntityType.PERSON:
        return createProfileRepository(options) as unknown as EntityRepository<T>;
      
      case EntityType.ORGANIZATION:
        return createOrganizationRepository(options) as unknown as EntityRepository<T>;
      
      case EntityType.EVENT:
        return createEventRepository(options) as unknown as EntityRepository<T>;
      
      case EntityType.HUB:
        return createHubRepository(options) as unknown as EntityRepository<T>;
      
      default:
        throw new Error(`No repository factory available for entity type: ${entityType}`);
    }
  }

  /**
   * Create an entity repository for testing
   * 
   * @param entityType Type of entity to create repository for
   * @param initialData Initial data to populate the repository
   * @returns Entity repository configured for testing
   */
  static createTestingRepository<T extends Entity>(
    entityType: EntityType,
    initialData?: T[]
  ): EntityRepository<T> {
    return EntityRepositoryFactory.createRepository<T>(entityType, {
      schema: 'testing',
      initialData,
      enableLogging: true
    });
  }
}

/**
 * Create an entity repository
 * 
 * @param entityType Type of entity
 * @param options Repository creation options
 * @returns Entity repository
 */
export function createEntityRepository<T extends Entity>(
  entityType: EntityType,
  options: {
    schema?: string;
    initialData?: T[];
    enableLogging?: boolean;
  } = {}
): EntityRepository<T> {
  return EntityRepositoryFactory.createRepository<T>(entityType, options);
}

/**
 * Create an entity repository for testing
 * 
 * @param entityType Type of entity to create repository for
 * @param initialData Initial data to populate the repository
 * @returns Entity repository configured for testing
 */
export function createTestingEntityRepository<T extends Entity>(
  entityType: EntityType,
  initialData?: T[]
): EntityRepository<T> {
  return EntityRepositoryFactory.createTestingRepository<T>(entityType, initialData);
}
