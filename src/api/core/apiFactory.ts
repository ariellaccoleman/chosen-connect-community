
import { supabase } from "@/integrations/supabase/client";
import { ListParams, QueryOptions, ApiOperations } from "./types";
import { ApiResponse, createErrorResponse, createSuccessResponse } from "./errorHandler";
import { apiClient } from "./apiClient";
import { logger } from "@/utils/logger";
import { PostgrestFilterBuilder } from "@supabase/supabase-js";

/**
 * Creates standardized CRUD API operations for a specific entity type
 * 
 * @param entityName - Name of the entity for logging and error messages
 * @param tableName - Database table name
 * @param options - Additional options for customizing behavior
 * @returns Object with standardized CRUD operations
 */
export function createApiOperations<T, TId = string, TCreate = Partial<T>, TUpdate = Partial<T>>(
  entityName: string,
  tableName: keyof typeof supabase.from extends string ? keyof typeof supabase.from : string,
  options: {
    idField?: string;
    defaultSelect?: string;
    defaultOrderBy?: string;
    softDelete?: boolean;
    transformResponse?: (item: any) => T;
    transformRequest?: (item: TCreate | TUpdate) => any;
  } = {}
): ApiOperations<T, TId, TCreate, TUpdate> {
  // Set default options
  const {
    idField = 'id',
    defaultSelect = '*',
    defaultOrderBy = 'created_at',
    softDelete = false,
    transformResponse = (item) => item as T,
    transformRequest = (item) => item
  } = options;

  /**
   * Get all entities with optional filtering and pagination
   */
  const getAll = async (params?: ListParams): Promise<ApiResponse<T[]>> => {
    try {
      logger.debug(`Fetching all ${entityName}`, params);
      
      return await apiClient.query(async (client) => {
        let query = client
          .from(tableName)
          .select(defaultSelect);
        
        // Apply filters if provided
        if (params?.filters) {
          Object.entries(params.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                query = query.in(key, value);
              } else {
                query = query.eq(key, value);
              }
            }
          });
        }
        
        // Apply search if provided
        if (params?.search) {
          // This is a simplified approach - in real implementation,
          // you would define which fields to search
          query = query.ilike('name', `%${params.search}%`);
        }
        
        // Apply pagination
        if (params?.page !== undefined && params?.limit !== undefined) {
          const start = (params.page - 1) * params.limit;
          query = query.range(start, start + params.limit - 1);
        }
        
        // Apply sorting
        const sortField = params?.sortBy || defaultOrderBy;
        const sortOrder = params?.sortDirection || 'desc';
        query = query.order(sortField, { ascending: sortOrder === 'asc' });
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Transform response data
        const transformedData = data.map(transformResponse);
        
        return createSuccessResponse(transformedData);
      });
    } catch (error) {
      logger.error(`Error fetching ${entityName}:`, error);
      return createErrorResponse(error);
    }
  };

  /**
   * Get a single entity by ID
   */
  const getById = async (id: TId): Promise<ApiResponse<T | null>> => {
    try {
      logger.debug(`Fetching ${entityName} with ID: ${String(id)}`);
      
      return await apiClient.query(async (client) => {
        const { data, error } = await client
          .from(tableName)
          .select(defaultSelect)
          .eq(idField, id)
          .maybeSingle();
        
        if (error) throw error;
        
        return createSuccessResponse(data ? transformResponse(data) : null);
      });
    } catch (error) {
      logger.error(`Error fetching ${entityName} by ID:`, error);
      return createErrorResponse(error);
    }
  };

  /**
   * Get multiple entities by their IDs
   */
  const getByIds = async (ids: TId[]): Promise<ApiResponse<T[]>> => {
    try {
      if (!ids.length) return createSuccessResponse([]);
      
      logger.debug(`Fetching ${entityName} with IDs:`, ids);
      
      return await apiClient.query(async (client) => {
        const { data, error } = await client
          .from(tableName)
          .select(defaultSelect)
          .in(idField, ids);
        
        if (error) throw error;
        
        const transformedData = data.map(transformResponse);
        
        return createSuccessResponse(transformedData);
      });
    } catch (error) {
      logger.error(`Error fetching ${entityName} by IDs:`, error);
      return createErrorResponse(error);
    }
  };

  /**
   * Create a new entity
   */
  const create = async (data: TCreate): Promise<ApiResponse<T>> => {
    try {
      logger.debug(`Creating new ${entityName}:`, data);
      
      const transformedData = transformRequest(data);
      
      return await apiClient.query(async (client) => {
        const { data: createdData, error } = await client
          .from(tableName)
          .insert(transformedData)
          .select(defaultSelect)
          .single();
        
        if (error) throw error;
        
        return createSuccessResponse(transformResponse(createdData));
      });
    } catch (error) {
      logger.error(`Error creating ${entityName}:`, error);
      return createErrorResponse(error);
    }
  };

  /**
   * Update an existing entity
   */
  const update = async (id: TId, data: TUpdate): Promise<ApiResponse<T>> => {
    try {
      logger.debug(`Updating ${entityName} with ID: ${String(id)}`, data);
      
      const transformedData = transformRequest(data);
      
      return await apiClient.query(async (client) => {
        const { data: updatedData, error } = await client
          .from(tableName)
          .update(transformedData)
          .eq(idField, id)
          .select(defaultSelect)
          .single();
        
        if (error) throw error;
        
        return createSuccessResponse(transformResponse(updatedData));
      });
    } catch (error) {
      logger.error(`Error updating ${entityName}:`, error);
      return createErrorResponse(error);
    }
  };

  /**
   * Delete an entity (hard delete or soft delete)
   */
  const deleteEntity = async (id: TId): Promise<ApiResponse<boolean>> => {
    try {
      logger.debug(`Deleting ${entityName} with ID: ${String(id)}`);
      
      return await apiClient.query(async (client) => {
        let error;
        
        if (softDelete) {
          // Soft delete - check if the table has deleted_at column first
          const updateData = { updated_at: new Date().toISOString() } as any;
          updateData.deleted_at = new Date().toISOString();
          
          const { error: updateError } = await client
            .from(tableName)
            .update(updateData)
            .eq(idField, id);
          
          error = updateError;
        } else {
          // Hard delete
          const { error: deleteError } = await client
            .from(tableName)
            .delete()
            .eq(idField, id);
          
          error = deleteError;
        }
        
        if (error) throw error;
        
        return createSuccessResponse(true);
      });
    } catch (error) {
      logger.error(`Error deleting ${entityName}:`, error);
      return createErrorResponse(error);
    }
  };

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
          .insert(transformedItems)
          .select(defaultSelect);
        
        if (error) throw error;
        
        const transformedData = data.map(transformResponse);
        
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
            const { data, error } = await client
              .from(tableName)
              .update(transformRequest(item.data))
              .eq(idField, item.id)
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
        let error;
        
        if (softDelete) {
          // Soft delete - update deleted_at field
          const updateData = { updated_at: new Date().toISOString() } as any;
          updateData.deleted_at = new Date().toISOString();
          
          const { error: updateError } = await client
            .from(tableName)
            .update(updateData)
            .in(idField, ids);
          
          error = updateError;
        } else {
          // Hard delete
          const { error: deleteError } = await client
            .from(tableName)
            .delete()
            .in(idField, ids);
          
          error = deleteError;
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
    getAll,
    getById,
    getByIds,
    create,
    update,
    delete: deleteEntity,
    batchCreate,
    batchUpdate,
    batchDelete
  };
}
