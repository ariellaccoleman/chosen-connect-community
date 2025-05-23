import { BaseRepository } from './BaseRepository';
import { Entity } from '@/types/entity';
import { EntityType } from '@/types/entityTypes';
import { RepositoryResponse } from './DataRepository';
import { logger } from '@/utils/logger';
import { createSuccessResponse } from './repositoryUtils';
import { TagAssignment } from '@/utils/tags/types';

/**
 * Abstract Entity Repository Class
 * Extends BaseRepository with entity-specific functionality
 */
export class EntityRepository<T extends Entity> {
  /**
   * Type of entity this repository handles
   */
  readonly entityType: EntityType;
  
  /**
   * Base repository for database operations
   */
  protected baseRepository: BaseRepository<T>;
  
  /**
   * Table name in the database
   */
  readonly tableName: string;

  constructor(tableName: string, entityType: EntityType, baseRepository: BaseRepository<T>) {
    this.tableName = tableName;
    this.entityType = entityType;
    this.baseRepository = baseRepository;
  }

  /**
   * Get the base repository used for direct database operations
   * @returns BaseRepository instance
   */
  getBaseRepository(): BaseRepository<T> {
    return this.baseRepository;
  }

  /**
   * Convert a database record to an entity
   * @param record Database record
   * @returns Entity object
   */
  convertToEntity(record: any): T {
    // Basic implementation - should be overridden in entity-specific repositories
    return {
      id: record.id,
      entityType: this.entityType,
      name: record.name || '',
      description: record.description || '',
      imageUrl: record.image_url || record.avatar_url || '',
      created_at: record.created_at,
      updated_at: record.updated_at,
    } as T;
  }

  /**
   * Convert an entity to a database record
   * @param entity Entity object
   * @returns Database record
   */
  convertFromEntity(entity: T): Record<string, any> {
    // Basic implementation - should be overridden in entity-specific repositories
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      image_url: entity.imageUrl,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }

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
      const result = await this.baseRepository.insert(record).single();
      
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
      const currentEntityResult = await this.baseRepository.select().eq('id', id).single();
      
      if (currentEntityResult.isError() || !currentEntityResult.data) {
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
      
      const currentEntity = this.convertToEntity(currentEntityResult.data);
      
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
      const result = await this.baseRepository.update(record).eq('id', id).single();
      
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
   * Get an entity by ID
   * @param id ID of the entity
   * @returns Entity or null if not found
   */
  async getById(id: string): Promise<RepositoryResponse<T>> {
    try {
      const result = await this.baseRepository.select().eq('id', id).maybeSingle();
      
      if (result.isSuccess() && result.data) {
        return createSuccessResponse<T>(this.convertToEntity(result.data));
      }
      
      return result as RepositoryResponse<T>;
    } catch (error) {
      this.handleError('getById', error, { id });
      return {
        data: null,
        error: {
          code: 'query_error',
          message: `Failed to get entity with ID ${id}`,
          original: error
        },
        isSuccess: () => false,
        isError: () => true,
        getErrorMessage: () => `Failed to get entity with ID ${id}`
      };
    }
  }

  /**
   * Get all entities of this type
   * @returns List of entities
   */
  async getAll(): Promise<RepositoryResponse<T[]>> {
    try {
      const result = await this.baseRepository.select().execute();
      
      if (result.isSuccess() && result.data) {
        return createSuccessResponse<T[]>(result.data.map(record => this.convertToEntity(record)));
      }
      
      return result as RepositoryResponse<T[]>;
    } catch (error) {
      this.handleError('getAll', error);
      return {
        data: null,
        error: {
          code: 'query_error',
          message: 'Failed to get all entities',
          original: error
        },
        isSuccess: () => false,
        isError: () => true,
        getErrorMessage: () => 'Failed to get all entities'
      };
    }
  }

  /**
   * Delete an entity
   * @param id ID of the entity to delete
   * @returns Success flag
   */
  async deleteEntity(id: string): Promise<RepositoryResponse<boolean>> {
    try {
      const result = await this.baseRepository.delete().eq('id', id).execute();
      
      return createSuccessResponse<boolean>(true);
    } catch (error) {
      this.handleError('deleteEntity', error, { id });
      return {
        data: null,
        error: {
          code: 'delete_error',
          message: `Failed to delete entity with ID ${id}`,
          original: error
        },
        isSuccess: () => false,
        isError: () => true,
        getErrorMessage: () => `Failed to delete entity with ID ${id}`
      };
    }
  }

  /**
   * Get an entity with its tags
   * @param id ID of the entity to retrieve
   * @returns Entity with tags
   */
  async getWithTags(id: string): Promise<RepositoryResponse<T>> {
    try {
      // Get the entity
      const entityResult = await this.getById(id);
      
      if (entityResult.isError() || !entityResult.data) {
        return entityResult;
      }
      
      // Get entity tags
      const tags = await this.getEntityTags(id);
      
      // Return entity with tags
      const entityWithTags = {
        ...entityResult.data,
        tags
      } as T;
      
      return createSuccessResponse<T>(entityWithTags);
    } catch (error) {
      this.handleError('getWithTags', error, { id });
      return {
        data: null,
        error: {
          code: 'query_error',
          message: `Failed to get entity with tags for ID ${id}`,
          original: error
        },
        isSuccess: () => false,
        isError: () => true,
        getErrorMessage: () => `Failed to get entity with tags for ID ${id}`
      };
    }
  }

  /**
   * Get tags for an entity
   * @param entityId ID of the entity
   * @returns Array of tags
   */
  protected async getEntityTags(entityId: string): Promise<TagAssignment[]> {
    try {
      // This is a placeholder implementation
      // It would typically use the TagAssignmentRepository to fetch tags
      return [];
    } catch (error) {
      this.handleError('getEntityTags', error, { entityId });
      return [];
    }
  }

  /**
   * Standard error handling for repository operations
   */
  protected handleError(operation: string, error: any, context: Record<string, any> = {}): void {
    logger.error(`${this.constructor.name}.${operation} error on table ${this.tableName}`, {
      error: error?.message || error,
      context,
      tableName: this.tableName,
      entityType: this.entityType
    });
  }
}
