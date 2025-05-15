
import { logger } from "@/utils/logger";
import { apiClient } from "../apiClient";
import { createSuccessResponse, createErrorResponse } from "../errorHandler";
import { ApiResponse } from "../types";
import { TableNames } from "./types";

/**
 * Creates standardized base CRUD operations for a specific entity type
 */
export function createBaseOperations<
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
    defaultOrderBy?: string;
    softDelete?: boolean;
    transformResponse?: (item: any) => T;
    transformRequest?: (item: any) => Record<string, any>;
  } = {}
) {
  // Set default options
  const {
    idField = 'id',
    defaultSelect = '*',
    defaultOrderBy = 'created_at',
    softDelete = false,
    transformResponse = (item) => item as T,
    transformRequest = (item) => item as unknown as Record<string, any>
  } = options;

  /**
   * Get all entities with optional filtering and pagination
   */
  const getAll = async (params?: any): Promise<ApiResponse<T[]>> => {
    try {
      logger.debug(`Fetching all ${entityName}`, params);
      
      return await apiClient.query(async (client) => {
        // Type-safe table access
        const query = client.from(tableName);
        let selectQuery = query.select(defaultSelect);
        
        // Apply filters if provided
        if (params?.filters) {
          Object.entries(params.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                selectQuery = selectQuery.in(key, value);
              } else {
                selectQuery = selectQuery.eq(key, value);
              }
            }
          });
        }
        
        // Apply search if provided
        if (params?.search) {
          selectQuery = selectQuery.ilike('name', `%${params.search}%`);
        }
        
        // Apply pagination
        if (params?.page !== undefined && params?.limit !== undefined) {
          const start = (params.page - 1) * params.limit;
          selectQuery = selectQuery.range(start, start + params.limit - 1);
        }
        
        // Apply sorting
        const sortField = params?.sortBy || defaultOrderBy;
        const sortOrder = params?.sortDirection || 'desc';
        selectQuery = selectQuery.order(sortField, { ascending: sortOrder === 'asc' });
        
        const { data, error } = await selectQuery;
        
        if (error) throw error;
        
        // Transform response data
        const transformedData = data ? data.map(transformResponse) : [];
        
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
          .eq(idField, id as any)
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
          .in(idField, ids as any[]);
        
        if (error) throw error;
        
        const transformedData = data ? data.map(transformResponse) : [];
        
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
          .insert(transformedData as any)
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
          .update(transformedData as any)
          .eq(idField, id as any)
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
        let error = null;
        
        if (softDelete) {
          // Soft delete - update deleted_at field
          const updateData = { updated_at: new Date().toISOString() } as Record<string, any>;
          updateData.deleted_at = new Date().toISOString();
          
          const result = await client
            .from(tableName)
            .update(updateData as any)
            .eq(idField, id as any);
          
          error = result.error;
        } else {
          // Hard delete
          const result = await client
            .from(tableName)
            .delete()
            .eq(idField, id as any);
          
          error = result.error;
        }
        
        if (error) throw error;
        
        return createSuccessResponse(true);
      });
    } catch (error) {
      logger.error(`Error deleting ${entityName}:`, error);
      return createErrorResponse(error);
    }
  };

  return {
    getAll,
    getById,
    getByIds,
    create,
    update,
    delete: deleteEntity
  };
}
