
import { logger } from "@/utils/logger";
import { apiClient } from "../../apiClient";
import { createSuccessResponse, createErrorResponse } from "../../errorHandler";
import { ApiResponse } from "../../types";
import { TableNames } from "../types";
import { DataRepository } from "../../repository/repositoryFactory";

/**
 * Options for batch operations
 */
interface BatchOperationsOptions<T> {
  tableName: string;
  entityName?: string;
  idField?: string;
  defaultSelect?: string;
  transformResponse?: (item: any) => T;
  transformRequest?: (item: any) => Record<string, any>;
  repository?: DataRepository<T> | (() => DataRepository<T>);
  softDelete?: boolean;
  clientFn?: () => any;
}

/**
 * Creates standardized batch operations
 */
export function createBatchOperations<
  T,
  TId = string,
  TCreate = Partial<T>,
  TUpdate = Partial<T>,
  Table extends TableNames = TableNames
>(
  options: BatchOperationsOptions<T>
) {
  // Set default options
  const {
    tableName,
    entityName = tableName,
    idField = 'id',
    defaultSelect = '*',
    transformResponse = (item) => item as T,
    transformRequest = (item) => item as unknown as Record<string, any>,
    repository: repoOption,
    softDelete = false,
    clientFn,
  } = options;

  // Resolve repository (handle both direct instances and factory functions)
  const repository = typeof repoOption === 'function' ? repoOption() : repoOption;

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
  const batchUpdate = async (items: Array<TUpdate & { id: TId }>): Promise<ApiResponse<boolean>> => {
    if (!items.length) return createSuccessResponse(true);
    
    try {
      logger.debug(`Batch updating ${entityName}:`, items);
      
      // Use api client for this regardless of repository
      return await apiClient.query(async (client) => {
        const updates = items.map(item => {
          const { id, ...updateData } = item;
          return {
            [idField]: id, // Use idField directly
            ...transformRequest(updateData as any)
          };
        });
        
        const { error } = await client
          .from(tableName)
          .upsert(updates as any[]);
        
        if (error) throw error;
        
        return createSuccessResponse(true);
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
      
      if (softDelete) {
        // For soft delete, update all records with deleted_at
        return await apiClient.query(async (client) => {
          // Fix TypeScript error by using proper type assertion
          const updateData = { deleted_at: new Date().toISOString() } as Record<string, any>;
          
          const { error } = await client
            .from(tableName)
            .update(updateData)
            .in(idField, ids as any[]);
          
          if (error) throw error;
          
          return createSuccessResponse(true);
        });
      }
      
      // Hard delete
      return await apiClient.query(async (client) => {
        const { error } = await client
          .from(tableName)
          .delete()
          .in(idField, ids as any[]);
        
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
