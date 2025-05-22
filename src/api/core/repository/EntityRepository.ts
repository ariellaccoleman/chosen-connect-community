
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
export abstract class EntityRepository<T extends Entity> {
  /**
   * Type of entity this repository handles
   */
  readonly entityType: EntityType;
  
  /**
   * Table name in the database
   */
  readonly tableName: string;

  /**
   * The base repository to delegate database operations to
   */
  protected baseRepository: BaseRepository<any>;

  /**
   * Create a new EntityRepository
   * 
   * @param tableName Table name in the database
   * @param entityType Type of entity this repository handles
   * @param baseRepository Base repository for delegation
   */
  constructor(tableName: string, entityType: EntityType, baseRepository: BaseRepository<any>) {
    this.tableName = tableName;
    this.entityType = entityType;
    this.baseRepository = baseRepository;
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
  abstract convertFromEntity(entity: Partial<T>): Record<string, any>;

  /**
   * The select method used to start a query
   * @param columns Columns to select
   * @returns A query builder
   */
  select(columns?: string) {
    return this.baseRepository.select(columns);
  }

  /**
   * The insert method used to insert data
   * @param values Values to insert
   * @returns A query builder
   */
  insert(values: Partial<T> | Partial<T>[]) {
    const convertedValues = Array.isArray(values)
      ? values.map(value => this.convertFromEntity(value as T)) 
      : this.convertFromEntity(values as T);
    
    return this.baseRepository.insert(convertedValues);
  }
  
  /**
   * The update method used to update data
   * @param values Values to update
   * @returns A query builder
   */
  update(values: Partial<T>) {
    return this.baseRepository.update(this.convertFromEntity(values as T));
  }
  
  /**
   * The delete method used to delete data
   * @returns A query builder
   */
  delete() {
    return this.baseRepository.delete();
  }

  /**
   * Handle errors in repository operations
   * @param operation Operation name
   * @param error Error object
   * @param context Additional context
   */
  protected handleError(operation: string, error: any, context?: Record<string, any>): void {
    logger.error(`Error in ${this.constructor.name}.${operation}:`, {
      error,
      context,
      entityType: this.entityType,
      tableName: this.tableName
    });
  }
  
  /**
   * Get entity by ID
   * @param id ID to lookup
   * @returns Entity or null
   */
  async getById(id: string): Promise<T | null> {
    try {
      const result = await this.baseRepository.select()
        .eq('id', id)
        .maybeSingle();
        
      if (result.isSuccess() && result.data) {
        return this.convertToEntity(result.data);
      }
      
      return null;
    } catch (error) {
      this.handleError('getById', error, { id });
      return null;
    }
  }
  
  /**
   * Get all entities
   * @returns Array of entities
   */
  async getAll(): Promise<T[]> {
    try {
      const result = await this.baseRepository.select().execute();
      
      if (result.isSuccess() && result.data) {
        return result.data.map(record => this.convertToEntity(record));
      }
      
      return [];
    } catch (error) {
      this.handleError('getAll', error);
      return [];
    }
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
      const dbRecord = this.convertFromEntity(entityWithType as T);
      
      // Insert into database
      const result = await this.baseRepository.insert(dbRecord).execute();
      
      // If successful, convert back to entity
      if (result.isSuccess() && result.data && Array.isArray(result.data) && result.data.length > 0) {
        return createSuccessResponse<T>(this.convertToEntity(result.data[0]));
      }
      
      return result as unknown as RepositoryResponse<T>;
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
      const dbRecord = this.convertFromEntity(updatedEntity);
      
      // Update in database
      const result = await this.baseRepository.update(dbRecord).eq('id', id).execute();
      
      // If successful, convert back to entity
      if (result.isSuccess() && result.data && Array.isArray(result.data) && result.data.length > 0) {
        return createSuccessResponse<T>(this.convertToEntity(result.data[0]));
      }
      
      return result as unknown as RepositoryResponse<T>;
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
}
