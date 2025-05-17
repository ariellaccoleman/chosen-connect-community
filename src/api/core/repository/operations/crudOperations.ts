
import { DataRepository, RepositoryResponse } from "../DataRepository";
import { logger } from "@/utils/logger";
import { ApiResponse, ApiError, createSuccessResponse, createErrorResponse } from "../../errorHandler";
import { CoreRepositoryOperations } from "./coreOperations";

/**
 * Repository operations for standard CRUD (Create, Read, Update, Delete) actions
 */
export class CrudRepositoryOperations<T, TId = string> extends CoreRepositoryOperations<T, TId> {
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
      return this.handleError(error, "retrieve");
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
      return this.handleError(error, "retrieve");
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
      return this.handleError(error, "create");
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
      return this.handleError(error, "update");
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
      return this.handleError(error, "delete");
    }
  }
}
