
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
  entityName: string,
  tableName: Table,
  options: {
    idField?: string;
    defaultSelect?: string;
    transformResponse?: (item: any) => T;
    transformRequest?: (item: any) => Record<string, any>;
    repository?: DataRepository<T>;
    softDelete?: boolean;
  } = {},
  providedClient?: any
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
        
        // Use repository if provided, otherwise use apiClient with optional client injection
        if (repository) {
          const result = await repository.insert(requestData).select(select).execute();
          
          if (result.error) throw result.error;
          
          const transformedData = Array.isArray(result.data) 
            ? result.data.map(transformResponse)
            : [];
            
          return createSuccessResponse(transformedData);
        }
        
        // Use apiClient with optional client injection
        return await apiClient.query(async (client) => {
          const { data, error } = await client
            .from(tableName)
            .insert(requestData as any)
            .select(select);
          
          if (error) throw error;
          
          const transformedData = Array.isArray(data) 
            ? data.map(transformResponse)
            : [];
            
          return createSuccessResponse(transformedData);
        }, providedClient);
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
    ): Promise<ApiResponse<T[]>> => {
      try {
        const results: T[] = [];
        
        // Process updates one by one to maintain individual references
        for (const item of items) {
          const id = item[idField as keyof typeof item] as unknown as TId;
          if (!id) throw new Error(`Missing ${idField} in update item`);
          
          // Transform data if needed
          const requestData = transformRequest(item as unknown as Record<string, any>);
          
          // Use repository if provided, otherwise use apiClient with optional client injection
          if (repository) {
            const result = await repository
              .update(requestData)
              .eq(idField, id as any)
              .select(select)
              .execute();
            
            if (result.error) throw result.error;
            
            if (result.data) {
              const transformedItem = Array.isArray(result.data) ? result.data[0] : result.data;
              results.push(transformResponse(transformedItem));
            }
          } else {
            // Use apiClient with optional client injection
            const apiResult = await apiClient.query(async (client) => {
              const { data, error } = await client
                .from(tableName)
                .update(requestData as any)
                .eq(idField, id as any)
                .select(select);
              
              if (error) throw error;
              
              return data;
            }, providedClient);
            
            if (apiResult.data) {
              const transformedItem = Array.isArray(apiResult.data) ? apiResult.data[0] : apiResult.data;
              results.push(transformResponse(transformedItem));
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
    ): Promise<ApiResponse<boolean>> => {
      try {
        // Use repository if provided, otherwise use apiClient with optional client injection
        if (repository) {
          if (softDelete) {
            const result = await repository
              .update({ deleted_at: new Date().toISOString() })
              .in(idField, ids as any[])
              .execute();
              
            if (result.error) throw result.error;
          } else {
            const result = await repository
              .delete()
              .in(idField, ids as any[])
              .execute();
            
            if (result.error) throw result.error;
          }
        } else {
          // Use apiClient with optional client injection
          await apiClient.query(async (client) => {
            if (softDelete) {
              const { error } = await client
                .from(tableName)
                .update({ deleted_at: new Date().toISOString() } as any)
                .in(idField, ids as any[]);
                
              if (error) throw error;
            } else {
              const { error } = await client
                .from(tableName)
                .delete()
                .in(idField, ids as any[]);
              
              if (error) throw error;
            }
          }, providedClient);
        }
        
        return createSuccessResponse(true);
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  };
}
