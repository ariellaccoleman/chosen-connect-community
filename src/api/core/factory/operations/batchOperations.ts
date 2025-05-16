
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
  idField?: string;
  defaultSelect?: string;
  transformResponse?: (item: any) => T;
  transformRequest?: (item: any) => Record<string, any>;
  repository?: DataRepository<T> | (() => DataRepository<T>);
  softDelete?: boolean;
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
    repository: repoOption,
    softDelete = false
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
      
      // Transform each item individually
      const transformedItems = items.map(item => transformRequest(item));
      
      // Use repository if provided, otherwise use apiClient
      if (repository) {
        const { data, error } = await repository.insert(transformedItems as any[])
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
      
      // Prepare updates by transforming each item and separating ID
      const updates = items.map(item => {
        const { id, ...updateData } = item;
        return {
          [idField]: id,
          ...transformRequest(updateData as any)
        };
      });
      
      // Use repository if provided
      if (repository) {
        // Since we can't update multiple items at once with repository,
        // we'll do it one by one and collect results
        for (const update of updates) {
          const id = update[idField];
          const { error } = await repository
            .update(update)
            .eq(idField, id)
            .execute();
          
          if (error) throw error;
        }
        
        return createSuccessResponse(true);
      }
      
      // Legacy implementation using apiClient
      return await apiClient.query(async (client) => {
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
      
      // Use repository if provided
      if (repository) {
        if (softDelete) {
          // For soft delete, update all records with deleted_at
          const updateData = { deleted_at: new Date().toISOString() } as any;
          
          const { error } = await repository
            .update(updateData)
            .in(idField, ids as any[])
            .execute();
          
          if (error) throw error;
        } else {
          // Hard delete
          const { error } = await repository
            .delete()
            .in(idField, ids as any[])
            .execute();
          
          if (error) throw error;
        }
        
        return createSuccessResponse(true);
      }
      
      // Legacy implementation using apiClient
      if (softDelete) {
        // For soft delete, update all records with deleted_at
        return await apiClient.query(async (client) => {
          const updateData = { deleted_at: new Date().toISOString() } as any;
          
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
