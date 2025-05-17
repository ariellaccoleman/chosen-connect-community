import { TableNames, ApiFactoryOptions } from "../types";
import { DataRepository } from "../../repository/DataRepository";
import { createRepository } from "../../repository/repositoryFactory";
import { ApiResponse, createSuccessResponse, createErrorResponse } from "../../errorHandler";

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
  entityName: string,
  tableName: Table,
  options: {
    idField?: string;
    defaultSelect?: string;
    transformResponse?: (item: any) => T;
    transformRequest?: (item: any) => Record<string, any>;
    repository?: DataRepository<T>;
    softDelete?: boolean;
  } = {}
) {
  // Extract options with defaults
  const {
    idField = "id",
    defaultSelect = "*",
    transformResponse = (item) => item as T,
    transformRequest = (item) => item as Record<string, any>,
    softDelete = false
  } = options;

  // Get or create repository
  const repository = options.repository || createRepository<T>(tableName as string);

  return {
    /**
     * Batch create entities
     */
    async batchCreate(
      items: TCreate[],
      select: string = defaultSelect
    ): Promise<ApiResponse<T[]>> {
      try {
        // Transform items if needed
        const requestData = items.map((item) => transformRequest(item as unknown as Record<string, any>));
        
        const result = await repository.insert(requestData).select(select);
        
        if (result.error) throw result.error;
        
        // Transform each result if needed
        const transformedData = Array.isArray(result.data) 
          ? result.data.map(transformResponse)
          : [];
          
        return createSuccessResponse(transformedData);
      } catch (error) {
        return createErrorResponse(error);
      }
    },
    
    /**
     * Batch update entities
     */
    async batchUpdate(
      items: (TUpdate & { [key: string]: TId })[],
      select: string = defaultSelect
    ): Promise<ApiResponse<T[]>> {
      try {
        const results: T[] = [];
        
        // Process updates one by one to maintain individual references
        for (const item of items) {
          const id = item[idField as keyof typeof item] as unknown as TId;
          if (!id) throw new Error(`Missing ${idField} in update item`);
          
          // Transform data if needed
          const requestData = transformRequest(item as unknown as Record<string, any>);
          
          // Execute the update
          const result = await repository
            .update(requestData)
            .eq(idField, id)
            .select(select);
          
          if (result.error) throw result.error;
          
          if (result.data) {
            // Transform result if needed
            const transformedItem = Array.isArray(result.data) ? result.data[0] : result.data;
            results.push(transformResponse(transformedItem));
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
      try {
        // If softDelete is enabled, update the deleted_at field
        if (softDelete) {
          const result = await repository
            .update({ deleted_at: new Date() })
            .in(idField, ids);
            
          if (result.error) throw result.error;
        } else {
          // Otherwise, perform a hard delete
          const result = await repository.delete().in(idField, ids);
          
          if (result.error) throw result.error;
        }
        
        return createSuccessResponse(true);
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  };
}
