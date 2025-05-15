
import { logger } from "@/utils/logger";
import { apiClient } from "../../apiClient";
import { createSuccessResponse, createErrorResponse } from "../../errorHandler";
import { ApiResponse } from "../../types";
import { TableNames } from "../types";

/**
 * Creates standardized query operations (read operations) for an entity
 */
export function createQueryOperations<
  T,
  TId = string,
  Table extends TableNames = TableNames
>(
  entityName: string,
  tableName: Table,
  options: {
    idField?: string;
    defaultSelect?: string;
    defaultOrderBy?: string;
    transformResponse?: (item: any) => T;
  } = {}
) {
  // Set default options
  const {
    idField = 'id',
    defaultSelect = '*',
    defaultOrderBy = 'created_at',
    transformResponse = (item) => item as T
  } = options;

  // Type assertion for string fields
  const typedIdField = idField as string;
  const typedDefaultOrderBy = defaultOrderBy as string;

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
                selectQuery = selectQuery.in(key as string, value as any[]);
              } else {
                selectQuery = selectQuery.eq(key as string, value as any);
              }
            }
          });
        }
        
        // Apply search if provided
        if (params?.search) {
          selectQuery = selectQuery.ilike('name' as string, `%${params.search}%`);
        }
        
        // Apply pagination
        if (params?.page !== undefined && params?.limit !== undefined) {
          const start = (params.page - 1) * params.limit;
          selectQuery = selectQuery.range(start, start + params.limit - 1);
        }
        
        // Apply sorting
        const sortField = params?.sortBy ? params.sortBy as string : typedDefaultOrderBy;
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
          .eq(typedIdField, id as any)
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
          .in(typedIdField, ids as any[]);
        
        if (error) throw error;
        
        const transformedData = data ? data.map(transformResponse) : [];
        
        return createSuccessResponse(transformedData);
      });
    } catch (error) {
      logger.error(`Error fetching ${entityName} by IDs:`, error);
      return createErrorResponse(error);
    }
  };

  return {
    getAll,
    getById,
    getByIds
  };
}
