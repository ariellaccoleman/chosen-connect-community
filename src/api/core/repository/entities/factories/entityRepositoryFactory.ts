
import { EntityRepositoryFactoryBase } from './EntityRepositoryFactoryBase';
import { BaseRepository } from '../../BaseRepository';
import { EntityRepository } from '../../EntityRepository';
import { Entity } from '@/types/entity';
import { EntityType } from '@/types/entityTypes';

import { createProfileRepository, ProfileRepositoryFactory } from './profileRepositoryFactory';
import { createOrganizationRepository, OrganizationRepositoryFactory } from './organizationRepositoryFactory';
import { createEventRepository, EventRepositoryFactory } from './eventRepositoryFactory';
import { createHubRepository, HubRepositoryFactory } from './hubRepositoryFactory';
import { Profile } from '@/types/profile';
import { Organization } from '@/types/organization';
import { Event } from '@/types/event';
import { Hub } from '@/types/hub';

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
  static createRepository<T>(
    entityType: EntityType,
    options: {
      schema?: string;
      initialData?: any[];
      enableLogging?: boolean;
    } = {}
  ): EntityRepository<T> {
    switch (entityType) {
      case EntityType.PERSON: {
        const factory = new ProfileRepositoryFactory();
        return factory.createRepository(options) as unknown as EntityRepository<T>;
      }
      
      case EntityType.ORGANIZATION: {
        const factory = new OrganizationRepositoryFactory();
        return factory.createRepository(options) as unknown as EntityRepository<T>;
      }
      
      case EntityType.EVENT: {
        const factory = new EventRepositoryFactory();
        return factory.createRepository(options) as unknown as EntityRepository<T>;
      }
      
      case EntityType.HUB: {
        const factory = new HubRepositoryFactory();
        return factory.createRepository(options) as unknown as EntityRepository<T>;
      }
      
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
  static createTestingRepository<T>(
    entityType: EntityType,
    initialData?: any[]
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
export function createEntityRepository<T>(
  entityType: EntityType,
  options: {
    schema?: string;
    initialData?: any[];
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
export function createTestingEntityRepository<T>(
  entityType: EntityType,
  initialData?: any[]
): EntityRepository<T> {
  return EntityRepositoryFactory.createTestingRepository<T>(entityType, initialData);
}
