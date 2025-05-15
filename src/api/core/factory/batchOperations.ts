
import { logger } from "@/utils/logger";
import { apiClient } from "../apiClient";
import { createSuccessResponse, createErrorResponse } from "../errorHandler";
import { ApiResponse } from "../types";
import { TableNames } from "./types";

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
    softDelete?: boolean;
  } = {}
) {
  // Set default options
  const {
    idField = 'id',
    defaultSelect = '*',
    softDelete = false,
    transformResponse = (item) => item as T,
    transformRequest = (item) => item as unknown as Record<string, any>
  } = options;

  /**
   * Create multiple entities at once
   */
  const batchCreate = async (items: TCreate[]): Promise<ApiResponse<T[]>> => {
    try {
      if (!items.length) return createSuccessResponse([]);
      
      logger.debug(`Batch creating ${entityName}s, count:`, items.length);
      
      const transformedItems = items.map(transformRequest);
      
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
      logger.error(`Error batch creating ${entityName}s:`, error);
      return createErrorResponse(error);
    }
  };

  /**
   * Update multiple entities at once
   */
  const batchUpdate = async (items: {id: TId, data: TUpdate}[]): Promise<ApiResponse<T[]>> => {
    try {
      if (!items.length) return createSuccessResponse([]);
      
      logger.debug(`Batch updating ${entityName}s, count:`, items.length);
      
      // For batch updates, we need to run separate updates for each item
      // This is not efficient but Supabase doesn't support bulk updates
      return await apiClient.query(async (client) => {
        const updates = await Promise.all(
          items.map(async (item) => {
            const transformedData = transformRequest(item.data);
            const { data, error } = await client
              .from(tableName)
              .update(transformedData as any)
              .eq(idField, item.id as any)
              .select(defaultSelect)
              .single();
            
            if (error) throw error;
            
            return transformResponse(data);
          })
        );
        
        return createSuccessResponse(updates);
      });
    } catch (error) {
      logger.error(`Error batch updating ${entityName}s:`, error);
      return createErrorResponse(error);
    }
  };

  /**
   * Delete multiple entities at once
   */
  const batchDelete = async (ids: TId[]): Promise<ApiResponse<boolean>> => {
    try {
      if (!ids.length) return createSuccessResponse(true);
      
      logger.debug(`Batch deleting ${entityName}s, count:`, ids.length);
      
      return await apiClient.query(async (client) => {
        let error = null;
        
        if (softDelete) {
          // Soft delete - update deleted_at field
          const updateData = { updated_at: new Date().toISOString() } as Record<string, any>;
          updateData.deleted_at = new Date().toISOString();
          
          const result = await client
            .from(tableName)
            .update(updateData as any)
            .in(idField, ids as any[]);
          
          error = result.error;
        } else {
          // Hard delete
          const result = await client
            .from(tableName)
            .delete()
            .in(idField, ids as any[]);
          
          error = result.error;
        }
        
        if (error) throw error;
        
        return createSuccessResponse(true);
      });
    } catch (error) {
      logger.error(`Error batch deleting ${entityName}s:`, error);
      return createErrorResponse(error);
    }
  };

  return {
    batchCreate,
    batchUpdate,
    batchDelete
  };
}
