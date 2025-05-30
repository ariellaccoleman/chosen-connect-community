import { TableNames, ApiFactoryOptions } from "../types";
import { DataRepository, RepositoryResponse } from "../../repository/DataRepository";
import { createRepository } from "../../repository/repositoryFactory";
import { ApiResponse, ApiResponseWithCount, createSuccessResponse, createErrorResponse } from "../../errorHandler";
import { apiClient } from "../../apiClient";

/**
 * Options for creating query operations
 */
interface QueryOperationsOptions<T> {
  idField?: string;
  defaultSelect?: string;
  defaultOrderBy?: string;
  transformResponse?: (item: any) => T;
  repository?: DataRepository<T> | (() => DataRepository<T>);
}

/**
 * Creates standardized query operations for a specific entity type
 */
export function createQueryOperations<
  T,
  TId = string,
  Table extends TableNames = TableNames
>(
  entityName: string,
  tableName: Table,
  options: QueryOperationsOptions<T> = {},
  providedClient?: any
) {
  // Extract options with defaults
  const {
    idField = "id",
    defaultSelect = "*",
    defaultOrderBy = "created_at",
    transformResponse = (item) => item as T,
    repository: repoOption
  } = options;

  // Resolve repository (handle both direct instances and factory functions)
  const repository = typeof repoOption === 'function' ? repoOption() : repoOption;

  return {
    /**
     * Get all entities with optional filtering, searching, and pagination
     */
    async getAll(queryOptions: {
      filters?: Record<string, any>;
      search?: string;
      searchColumns?: string[];
      orderBy?: string;
      ascending?: boolean;
      limit?: number;
      offset?: number;
      select?: string;
      includeCount?: boolean;
      page?: number;
      sortBy?: string;
      sortDirection?: 'asc' | 'desc';
    } = {}): Promise<ApiResponse<T[]> | ApiResponseWithCount<T[]>> {
      try {
        const {
          filters = {},
          search,
          searchColumns = ['name'],
          orderBy = defaultOrderBy,
          ascending = false,
          limit,
          offset,
          select = defaultSelect,
          includeCount = false,
          page,
          sortBy,
          sortDirection = 'desc'
        } = queryOptions;

        // Calculate offset from page if provided
        const calculatedOffset = page && limit ? (page - 1) * limit : offset;
        
        // Use sortBy and sortDirection if provided, otherwise fall back to orderBy and ascending
        const finalOrderBy = sortBy || orderBy;
        const finalAscending = sortDirection === 'asc' ? true : (ascending || false);

        // Use repository if provided, otherwise use apiClient with optional client injection
        if (repository) {
          let query = repository.select(select);

          // Apply filters
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                query = query.in(key, value);
              } else {
                query = query.eq(key, value);
              }
            }
          });

          // Apply search
          if (search && searchColumns.length > 0) {
            // For now, just search on the first column
            query = query.ilike(searchColumns[0], `%${search}%`);
          }

          // Apply ordering
          query = query.order(finalOrderBy, { ascending: finalAscending });

          // Apply pagination
          if (limit !== undefined) {
            const from = calculatedOffset || 0;
            const to = from + limit - 1;
            query = query.range(from, to);
          }

          const result = await query.execute();
          
          if (result.error) throw result.error;
          
          const transformedData = Array.isArray(result.data) 
            ? result.data.map(transformResponse)
            : [];

          // If count is requested, make a separate count query
          if (includeCount) {
            let countQuery = repository.select('*');
            
            // Apply the same filters for count
            Object.entries(filters).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                  countQuery = countQuery.in(key, value);
                } else {
                  countQuery = countQuery.eq(key, value);
                }
              }
            });

            // Apply search for count
            if (search && searchColumns.length > 0) {
              countQuery = countQuery.ilike(searchColumns[0], `%${search}%`);
            }

            const countResult = await countQuery.execute();
            const totalCount = Array.isArray(countResult.data) ? countResult.data.length : 0;

            return {
              data: transformedData,
              totalCount,
              error: null,
              status: 'success'
            };
          }
            
          return createSuccessResponse(transformedData);
        }

        // Use apiClient with optional client injection
        return await apiClient.query(async (client) => {
          let query = client.from(tableName).select(select, includeCount ? { count: 'exact' } : {});

          // Apply filters
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                query = query.in(key, value);
              } else {
                query = query.eq(key, value);
              }
            }
          });

          // Apply search
          if (search && searchColumns.length > 0) {
            // For now, just search on the first column
            query = query.ilike(searchColumns[0], `%${search}%`);
          }

          // Apply ordering
          query = query.order(finalOrderBy, { ascending: finalAscending });

          // Apply pagination
          if (limit !== undefined) {
            const from = calculatedOffset || 0;
            const to = from + limit - 1;
            query = query.range(from, to);
          }

          const { data, error, count } = await query;
          
          if (error) throw error;
          
          const transformedData = Array.isArray(data) 
            ? data.map(transformResponse)
            : [];

          if (includeCount) {
            return {
              data: transformedData,
              totalCount: count || 0,
              error: null,
              status: 'success'
            };
          }
            
          return createSuccessResponse(transformedData);
        }, providedClient);
      } catch (error) {
        if (includeCount) {
          return {
            data: null,
            totalCount: 0,
            error: error as any,
            status: 'error'
          };
        }
        return createErrorResponse(error);
      }
    },

    /**
     * Get entity by ID
     */
    async getById(id: TId, select: string = defaultSelect): Promise<ApiResponse<T | null>> {
      try {
        // Use repository if provided, otherwise use apiClient with optional client injection
        if (repository) {
          const result = await repository
            .select(select)
            .eq(idField, id as any)
            .maybeSingle();
          
          if (result.error) throw result.error;
          
          return createSuccessResponse(result.data ? transformResponse(result.data) : null);
        }

        // Use apiClient with optional client injection
        return await apiClient.query(async (client) => {
          const { data, error } = await client
            .from(tableName)
            .select(select)
            .eq(idField, id as any)
            .maybeSingle();
          
          if (error) throw error;
          
          return createSuccessResponse(data ? transformResponse(data) : null);
        }, providedClient);
      } catch (error) {
        return createErrorResponse(error);
      }
    },

    /**
     * Get multiple entities by IDs
     */
    async getByIds(ids: TId[], select: string = defaultSelect): Promise<ApiResponse<T[]>> {
      try {
        if (!ids.length) {
          return createSuccessResponse([]);
        }

        // Use repository if provided, otherwise use apiClient with optional client injection
        if (repository) {
          const result = await repository
            .select(select)
            .in(idField, ids as any[])
            .execute();
          
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
            .select(select)
            .in(idField, ids as any[]);
          
          if (error) throw error;
          
          const transformedData = Array.isArray(data) 
            ? data.map(transformResponse)
            : [];
            
          return createSuccessResponse(transformedData);
        }, providedClient);
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  };
}
