
import { BaseRepository } from './BaseRepository';
import { Entity } from '@/types/entity';
import { EntityType } from '@/types/entityTypes';
import { RepositoryResponse } from './DataRepository';
import { logger } from '@/utils/logger';
import { createSuccessResponse } from './repositoryUtils';

/**
 * Abstract Entity Repository Class
 * Extends BaseRepository with entity-specific functionality
 */
export abstract class EntityRepository<T extends Entity> extends BaseRepository<T> {
  /**
   * Type of entity this repository handles
   */
  readonly entityType: EntityType;

  constructor(tableName: string, entityType: EntityType) {
    super(tableName);
    this.entityType = entityType;
  }

  /**
   * Convert a database record to an entity
   * @param record Database record
   * @returns Entity object
   */
  abstract convertToEntity(record: any): T;

  /**
   * Convert an entity to a database record
   * @param entity Entity object
   * @returns Database record
   */
  abstract convertFromEntity(entity: T): Record<string, any>;

  /**
   * Validate an entity
   * @param entity Entity to validate
   * @returns Validation result with errors if any
   */
  validateEntity(entity: T): { isValid: boolean; errors?: Record<string, string> } {
    // Basic validation - can be overridden in entity-specific repositories
    const errors: Record<string, string> = {};
    
    // All entities should have a name
    if (!entity.name) {
      errors.name = 'Name is required';
    }
    
    // Ensure entity type is correct
    if (entity.entityType !== this.entityType) {
      errors.entityType = `Entity type must be ${this.entityType}`;
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    };
  }

  /**
   * Create a new entity
   * @param entity Entity to create
   * @returns Created entity
   */
  async createEntity(entity: Partial<T>): Promise<RepositoryResponse<T>> {
    try {
      // Ensure entity has the correct type
      const entityWithType = {
        ...entity,
        entityType: this.entityType
      } as T;
      
      // Validate the entity
      const validation = this.validateEntity(entityWithType as T);
      if (!validation.isValid && validation.errors) {
        logger.error(`${this.constructor.name}.createEntity validation failed`, {
          errors: validation.errors,
          entity
        });
        
        return {
          data: null,
          error: {
            code: 'validation_error',
            message: 'Entity validation failed',
            details: validation.errors
          },
          isSuccess: () => false,
          isError: () => true,
          getErrorMessage: () => 'Entity validation failed'
        };
      }
      
      // Convert to database record
      const record = this.convertFromEntity(entityWithType as T);
      
      // Insert into database
      const result = await this.insert(record).single();
      
      // If successful, convert back to entity
      if (result.isSuccess() && result.data) {
        return createSuccessResponse<T>(this.convertToEntity(result.data));
      }
      
      return result as RepositoryResponse<T>;
    } catch (error) {
      this.handleError('createEntity', error, { entity });
      return {
        data: null,
        error: {
          code: 'create_error',
          message: 'Failed to create entity',
          original: error
        },
        isSuccess: () => false,
        isError: () => true,
        getErrorMessage: () => 'Failed to create entity'
      };
    }
  }

  /**
   * Update an entity
   * @param id ID of the entity to update
   * @param updates Updates to apply
   * @returns Updated entity
   */
  async updateEntity(id: string, updates: Partial<T>): Promise<RepositoryResponse<T>> {
    try {
      // Get current entity
      const currentEntity = await this.getById(id);
      if (!currentEntity) {
        return {
          data: null,
          error: {
            code: 'not_found',
            message: `Entity with ID ${id} not found`
          },
          isSuccess: () => false,
          isError: () => true,
          getErrorMessage: () => `Entity with ID ${id} not found`
        };
      }
      
      // Merge updates with current entity
      const updatedEntity = {
        ...currentEntity,
        ...updates,
        entityType: this.entityType // Ensure entity type cannot be changed
      } as T;
      
      // Validate the updated entity
      const validation = this.validateEntity(updatedEntity);
      if (!validation.isValid && validation.errors) {
        logger.error(`${this.constructor.name}.updateEntity validation failed`, {
          errors: validation.errors,
          id,
          updates
        });
        
        return {
          data: null,
          error: {
            code: 'validation_error',
            message: 'Entity validation failed',
            details: validation.errors
          },
          isSuccess: () => false,
          isError: () => true,
          getErrorMessage: () => 'Entity validation failed'
        };
      }
      
      // Convert to database record
      const record = this.convertFromEntity(updatedEntity);
      
      // Update in database
      const result = await this.update(record).eq('id', id).single();
      
      // If successful, convert back to entity
      if (result.isSuccess() && result.data) {
        return createSuccessResponse<T>(this.convertToEntity(result.data));
      }
      
      return result as RepositoryResponse<T>;
    } catch (error) {
      this.handleError('updateEntity', error, { id, updates });
      return {
        data: null,
        error: {
          code: 'update_error',
          message: 'Failed to update entity',
          original: error
        },
        isSuccess: () => false,
        isError: () => true,
        getErrorMessage: () => 'Failed to update entity'
      };
    }
  }

  /**
   * Get entities by their type
   * @returns List of entities
   */
  async getByEntityType(): Promise<T[]> {
    try {
      const result = await this.select().execute();
      
      if (result.isSuccess() && result.data) {
        // Convert all records to entities
        return result.data.map(record => this.convertToEntity(record));
      }
      
      return [];
    } catch (error) {
      this.handleError('getByEntityType', error);
      return [];
    }
  }

  /**
   * Get an entity with its tags
   * @param id ID of the entity to retrieve
   * @returns Entity with tags
   */
  async getWithTags(id: string): Promise<T | null> {
    try {
      // Get the entity
      const entity = await this.getById(id);
      if (!entity) {
        return null;
      }
      
      // Get entity tags (implementation depends on how tags are stored)
      // This is a placeholder - actual implementation will vary based on your data model
      const tags = await this.getEntityTags(id);
      
      // Return entity with tags
      return {
        ...entity,
        tags: tags
      };
    } catch (error) {
      this.handleError('getWithTags', error, { id });
      return null;
    }
  }

  /**
   * Get tags for an entity
   * This is a placeholder method - the actual implementation will depend on your tagging system
   * @param entityId ID of the entity
   * @returns Array of tags
   */
  protected async getEntityTags(entityId: string): Promise<any[]> {
    // Placeholder implementation - to be overridden in concrete classes
    // This would typically query a tag-entity relationship table
    return [];
  }

  /**
   * Assign a tag to an entity
   * @param entityId ID of the entity
   * @param tagId ID of the tag
   * @returns Success flag
   */
  async assignTag(entityId: string, tagId: string): Promise<boolean> {
    try {
      // Placeholder implementation - to be overridden in concrete classes
      // This would typically insert into a tag-entity relationship table
      logger.info(`Assigning tag ${tagId} to entity ${entityId}`);
      return true;
    } catch (error) {
      this.handleError('assignTag', error, { entityId, tagId });
      return false;
    }
  }

  /**
   * Remove a tag from an entity
   * @param entityId ID of the entity
   * @param tagId ID of the tag
   * @returns Success flag
   */
  async removeTag(entityId: string, tagId: string): Promise<boolean> {
    try {
      // Placeholder implementation - to be overridden in concrete classes
      // This would typically delete from a tag-entity relationship table
      logger.info(`Removing tag ${tagId} from entity ${entityId}`);
      return true;
    } catch (error) {
      this.handleError('removeTag', error, { entityId, tagId });
      return false;
    }
  }
}
