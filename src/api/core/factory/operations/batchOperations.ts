import { logger } from "@/utils/logger";
import { apiClient } from "../../apiClient";
import { createSuccessResponse, createErrorResponse } from "../../errorHandler";
import { ApiResponse } from "../../types";
import { TableNames } from "../types";
import { DataRepository } from "../../repository/repositoryFactory";

/**
 * Options for creating batch operations
 */
interface BatchOperationsOptions<T> {
  idField?: string;
  defaultSelect?: string;
  transformResponse?: (item: any) => T;
  transformRequest?: (item: any) => Record<string, any>;
  repository?: DataRepository<T>;
}

/**
 * Creates standardized batch operations for an entity
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
  options: BatchOperationsOptions<T> = {}
) {
  // Set default options
  const {
    idField = 'id',
    defaultSelect = '*',
    transformResponse = (item) => item as T,
    transformRequest = (item) => item as unknown as Record<string, any>,
    repository
  } = options;

  // Type assertion for ID field
  const typedIdField = idField as string;
  
  /**
   * Create multiple entities in a single operation
   */
  const batchCreate = async (items: TCreate[]): Promise<ApiResponse<T[]>> => {
    if (!items.length) return createSuccessResponse([]);
    
    try {
      logger.debug(`Batch creating ${entityName}:`, items);
      
      const transformedItems = items.map(transformRequest);
      
      // Use repository if provided, otherwise use apiClient
      if (repository) {
        const insertQuery = repository.insert(transformedItems as any[]);
        // Fixed: Make sure to build the query correctly
        const { data, error } = await insertQuery
          .select(defaultSelect)
          .execute();
        
        if (error) throw error;
        
        const transformedData = data ? data.map(transformResponse) : [];
        
        return createSuccessResponse(transformedData);
      }
      
      // Legacy implementation using apiClient
      return await apiClient.query(async (client) => {
        const { data, error } = await client
          .from(tableName)
          .insert(transformedItems as any[])
          .select(defaultSelect);
        
        if (error) throw error;
        
        const transformedData = data ? data.map(transformResponse) : [];
        
        return createSuccessResponse(transformedData);
      });
    } catch (error) {
      logger.error(`Error batch creating ${entityName}:`, error);
      return createErrorResponse(error);
    }
  };

  /**
   * Update multiple entities in a single operation
   * Each item must have an ID field
   */
  const batchUpdate = async (items: Array<TUpdate & { id: TId }>): Promise<ApiResponse<T[]>> => {
    if (!items.length) return createSuccessResponse([]);
    
    try {
      logger.debug(`Batch updating ${entityName}:`, items);
      
      // Upsert (update or insert) not directly supported by the repository pattern
      // We'll handle this with individual updates
      
      // Use api client for this regardless of repository
      return await apiClient.query(async (client) => {
        const updates = items.map(item => {
          const { id, ...updateData } = item;
          return {
            [typedIdField]: id,
            ...transformRequest(updateData as any)
          };
        });
        
        const { data, error } = await client
          .from(tableName)
          .upsert(updates as any[])
          .select(defaultSelect);
        
        if (error) throw error;
        
        const transformedData = data ? data.map(transformResponse) : [];
        
        return createSuccessResponse(transformedData);
      });
    } catch (error) {
      logger.error(`Error batch updating ${entityName}:`, error);
      return createErrorResponse(error);
    }
  };

  /**
   * Delete multiple entities in a single operation
   */
  const batchDelete = async (ids: TId[]): Promise<ApiResponse<boolean>> => {
    if (!ids.length) return createSuccessResponse(true);
    
    try {
      logger.debug(`Batch deleting ${entityName} with IDs:`, ids);
      
      // Use api client for this regardless of repository
      return await apiClient.query(async (client) => {
        const { error } = await client
          .from(tableName)
          .delete()
          .in(typedIdField, ids as any[]);
        
        if (error) throw error;
        
        return createSuccessResponse(true);
      });
    } catch (error) {
      logger.error(`Error batch deleting ${entityName}:`, error);
      return createErrorResponse(error);
    }
  };

  return {
    batchCreate,
    batchUpdate,
    batchDelete
  };
}
