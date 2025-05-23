
import { BaseRepository } from '../../BaseRepository';
import { EntityRepository } from '../../EntityRepository';
import { Entity } from '@/types/entity';
import { EntityType } from '@/types/entityTypes';

import { createProfileRepository } from '../ProfileRepository';
import { createOrganizationRepository } from '../OrganizationRepository';
import { createEventRepository } from '../EventRepository';
import { createHubRepository } from '../HubRepository';

/**
 * Factory for creating entity repositories
 */
export class EntityRepositoryFactory {
  /**
   * Create an entity repository for the specified type
   * 
   * @param entityType Type of entity to create repository for
   * @param baseRepository Base repository to use for database operations
   * @returns Entity repository
   */
  static createRepository<T extends Entity>(
    entityType: EntityType,
    baseRepository: BaseRepository<T>
  ): EntityRepository<T> {
    switch (entityType) {
      case EntityType.PERSON:
        return createProfileRepository(
          baseRepository as any
        ) as unknown as EntityRepository<T>;
      
      case EntityType.ORGANIZATION:
        return createOrganizationRepository(
          baseRepository as any
        ) as unknown as EntityRepository<T>;
      
      case EntityType.EVENT:
        return createEventRepository(
          baseRepository as any
        ) as unknown as EntityRepository<T>;
      
      case EntityType.HUB:
        return createHubRepository(
          baseRepository as any
        ) as unknown as EntityRepository<T>;
      
      default:
        // For entity types without specific repositories, use a generic EntityRepository
        return new EntityRepository<T>(
          baseRepository.tableName,
          entityType,
          baseRepository
        );
    }
  }
}

/**
 * Create an entity repository
 * 
 * @param entityType Type of entity
 * @param baseRepository Base repository to use for database operations
 * @returns Entity repository
 */
export function createEntityRepository<T extends Entity>(
  entityType: EntityType,
  baseRepository: BaseRepository<T>
): EntityRepository<T> {
  return EntityRepositoryFactory.createRepository<T>(entityType, baseRepository);
}
