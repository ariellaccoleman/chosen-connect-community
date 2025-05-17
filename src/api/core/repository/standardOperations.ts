
import { DataRepository, RepositoryResponse } from "./DataRepository";
import { logger } from "@/utils/logger";
import { ApiResponse, ApiError, createSuccessResponse, createErrorResponse } from "../errorHandler";

/**
 * Standard operations that can be applied to any repository
 */
export class StandardRepositoryOperations<T, TId = string> {
  constructor(
    private repository: DataRepository<T>,
    private entityName: string = "Entity"
  ) {}

  /**
   * Get a single entity by ID with error handling
   */
  async getById(id: TId): Promise<ApiResponse<T | null>> {
    try {
      const result = await this.repository.getById(id as string | number);
      
      if (!result || (result as unknown as RepositoryResponse<T>).isError()) {
        throw (result as unknown as RepositoryResponse<T>).error;
      }
      
      return createSuccessResponse((result as unknown as RepositoryResponse<T>).data);
    } catch (error) {
      logger.error(`Error getting ${this.entityName} by ID:`, error);
      return createErrorResponse({ 
        message: `Failed to retrieve ${this.entityName.toLowerCase()}` 
      } as ApiError);
    }
  }

  /**
   * Get all entities with error handling
   */
  async getAll(): Promise<ApiResponse<T[]>> {
    try {
      const result = await this.repository.getAll();
      
      if ((result as unknown as RepositoryResponse<T[]>).isError()) {
        throw (result as unknown as RepositoryResponse<T[]>).error;
      }
      
      return createSuccessResponse((result as unknown as RepositoryResponse<T[]>).data as T[]);
    } catch (error) {
      logger.error(`Error getting all ${this.entityName}s:`, error);
      return createErrorResponse({ 
        message: `Failed to retrieve ${this.entityName.toLowerCase()} list` 
      } as ApiError);
    }
  }

  /**
   * Get entities by a list of IDs with error handling
   */
  async getByIds(ids: TId[]): Promise<ApiResponse<T[]>> {
    try {
      const result = await this.repository
        .select()
        .in("id", ids as (string | number)[])
        .execute();
      
      if (result.isError()) {
        throw result.error;
      }
      
      return createSuccessResponse(result.data as T[]);
    } catch (error) {
      logger.error(`Error getting ${this.entityName}s by IDs:`, error);
      return createErrorResponse({ 
        message: `Failed to retrieve ${this.entityName.toLowerCase()} items` 
      } as ApiError);
    }
  }

  /**
   * Create a new entity with error handling
   */
  async create(data: Partial<T>): Promise<ApiResponse<T>> {
    try {
      const result = await this.repository
        .insert(data as Record<string, any>)
        .execute();
      
      if (result.isError()) {
        throw result.error;
      }
      
      // For inserts, we expect the first item from the result
      const insertedData = Array.isArray(result.data) && result.data.length > 0 
        ? result.data[0] 
        : result.data;
      
      return createSuccessResponse(insertedData as T);
    } catch (error) {
      logger.error(`Error creating ${this.entityName}:`, error);
      return createErrorResponse({ 
        message: `Failed to create ${this.entityName.toLowerCase()}` 
      } as ApiError);
    }
  }

  /**
   * Update an existing entity with error handling
   */
  async update(id: TId, data: Partial<T>): Promise<ApiResponse<T>> {
    try {
      const result = await this.repository
        .update(data as Record<string, any>)
        .eq("id", id as string | number)
        .execute();
      
      if (result.isError()) {
        throw result.error;
      }
      
      // For updates, we expect the first item from the result
      const updatedData = Array.isArray(result.data) && result.data.length > 0 
        ? result.data[0] 
        : result.data;
        
      return createSuccessResponse(updatedData as T);
    } catch (error) {
      logger.error(`Error updating ${this.entityName}:`, error);
      return createErrorResponse({ 
        message: `Failed to update ${this.entityName.toLowerCase()}` 
      } as ApiError);
    }
  }

  /**
   * Delete an entity with error handling
   */
  async delete(id: TId): Promise<ApiResponse<boolean>> {
    try {
      const result = await this.repository
        .delete()
        .eq("id", id as string | number)
        .execute();
        
      if (result.isError()) {
        throw result.error;
      }
      
      return createSuccessResponse(true);
    } catch (error) {
      logger.error(`Error deleting ${this.entityName}:`, error);
      return createErrorResponse({ 
        message: `Failed to delete ${this.entityName.toLowerCase()}` 
      } as ApiError);
    }
  }

  /**
   * Check if an entity with the given ID exists
   */
  async exists(id: TId): Promise<boolean> {
    try {
      const result = await this.repository
        .select("id")
        .eq("id", id as string | number)
        .maybeSingle();
        
      if (result.isError()) {
        throw result.error;
      }
        
      return result.data !== null;
    } catch (error) {
      logger.error(`Error checking if ${this.entityName} exists:`, error);
      return false;
    }
  }

  /**
   * Count entities matching a filter condition
   */
  async count(column: string, value: any): Promise<number> {
    try {
      const result = await this.repository
        .select("id", { count: true })
        .eq(column, value)
        .execute();
        
      if (result.isError()) {
        return 0;
      }
      
      // If the repository implementation supports count, use it
      if (result.data && typeof result.data === 'object' && 'count' in result.data) {
        return (result.data as any).count || 0;
      }
      
      // Otherwise, count the results manually
      return Array.isArray(result.data) ? result.data.length : 0;
    } catch (error) {
      logger.error(`Error counting ${this.entityName}s:`, error);
      return 0;
    }
  }
}

/**
 * Create standard repository operations for a repository
 */
export function createStandardOperations<T, TId = string>(
  repository: DataRepository<T>,
  entityName: string = "Entity"
): StandardRepositoryOperations<T, TId> {
  return new StandardRepositoryOperations<T, TId>(repository, entityName);
}
