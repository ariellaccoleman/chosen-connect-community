
import { TableNames, ApiFactoryOptions } from "../types";
import { DataRepository, RepositoryResponse } from "../../repository/DataRepository";
import { createRepository } from "../../repository/repositoryFactory";
import { ApiResponse, createSuccessResponse, createErrorResponse } from "../../errorHandler";
import { apiClient } from "../../apiClient";

/**
 * Creates standardized batch operations for a specific entity type
 */
export function createBatchOperations<
  T,
  TId = string,
  TCreate = Partial<T>,
  TUpdate = Partial<T>,
  Table extends TableNames = TableNames
>(
  repository: DataRepository<T>,
  entityName: string = "Entity"
) {
  return {
    /**
     * Batch create entities
     */
    async batchCreate(
      items: TCreate[]
    ): Promise<ApiResponse<T[]>> {
      // Handle empty arrays gracefully
      if (!items || items.length === 0) {
        return createSuccessResponse([] as T[]);
      }

      try {
        const result = await repository.insert(items).execute();
        
        if (result.isError()) {
          throw result.error;
        }
        
        const data = Array.isArray(result.data) ? result.data : (result.data ? [result.data] : []);
        return createSuccessResponse(data as T[]);
      } catch (error) {
        return createErrorResponse(error);
      }
    },
    
    /**
     * Batch update entities
     */
    async batchUpdate(
      items: (TUpdate & { id: TId })[]
    ): Promise<ApiResponse<T[]>> {
      // Handle empty arrays gracefully
      if (!items || items.length === 0) {
        return createSuccessResponse([] as T[]);
      }

      try {
        const results: T[] = [];
        
        // Process updates one by one to maintain individual references
        for (const item of items) {
          const { id, ...updateData } = item;
          if (!id) throw new Error(`Missing id in update item`);
          
          const result = await repository
            .update(updateData)
            .eq('id', id as any)
            .execute();
          
          if (result.isError()) {
            throw result.error;
          }
          
          if (result.data) {
            const updatedItem = Array.isArray(result.data) ? result.data[0] : result.data;
            if (updatedItem) {
              results.push(updatedItem as T);
            }
          }
        }
        
        return createSuccessResponse(results);
      } catch (error) {
        return createErrorResponse(error);
      }
    },
    
    /**
     * Batch delete entities
     */
    async batchDelete(
      ids: TId[]
    ): Promise<ApiResponse<boolean>> {
      // Handle empty arrays gracefully
      if (!ids || ids.length === 0) {
        return createSuccessResponse(true);
      }

      try {
        const result = await repository
          .delete()
          .in('id', ids as any[])
          .execute();
        
        if (result.isError()) {
          throw result.error;
        }
        
        return createSuccessResponse(true);
      } catch (error) {
        return createErrorResponse(error);
      }
    },

    /**
     * Batch upsert (insert or update) entities
     */
    async batchUpsert(
      items: (Partial<T> & { id?: TId })[]
    ): Promise<ApiResponse<T[]>> {
      // Handle empty arrays gracefully
      if (!items || items.length === 0) {
        return createSuccessResponse([] as T[]);
      }

      try {
        // Separate items with IDs (updates) and without IDs (inserts)
        const itemsWithIds = items.filter(item => item.id) as (TUpdate & { id: TId })[];
        const itemsWithoutIds = items.filter(item => !item.id) as TCreate[];
        
        const results: T[] = [];
        
        // Process inserts
        if (itemsWithoutIds.length > 0) {
          const createResponse = await this.batchCreate(itemsWithoutIds);
          if (!createResponse.error && Array.isArray(createResponse.data)) {
            results.push(...createResponse.data);
          }
        }
        
        // Process updates
        if (itemsWithIds.length > 0) {
          const updateResponse = await this.batchUpdate(itemsWithIds);
          if (!updateResponse.error && Array.isArray(updateResponse.data)) {
            results.push(...updateResponse.data);
          }
        }
        
        return createSuccessResponse(results);
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  };
}
