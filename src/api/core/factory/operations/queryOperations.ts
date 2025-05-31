
import { TableNames, ApiFactoryOptions } from "../types";
import { DataRepository, RepositoryResponse } from "../../repository/DataRepository";
import { createRepository } from "../../repository/repositoryFactory";
import { ApiResponse, createSuccessResponse, createErrorResponse } from "../../errorHandler";
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
  withTagsView?: string; // Name of the *_with_tags view for enhanced operations
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
    repository: repoOption,
    withTagsView
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
      includeTags?: boolean;
    } = {}): Promise<ApiResponse<T[]>> {
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
          includeTags = false
        } = queryOptions;

        // Use the with_tags view if tags are requested and available
        const tableToQuery = includeTags && withTagsView ? withTagsView : tableName;

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
          query = query.order(orderBy, { ascending });

          // Apply pagination
          if (limit !== undefined) {
            const from = offset || 0;
            const to = from + limit - 1;
            query = query.range(from, to);
          }

          const result = await query.execute();
          
          if (result.error) throw result.error;
          
          const transformedData = Array.isArray(result.data) 
            ? result.data.map(transformResponse)
            : [];
            
          return createSuccessResponse(transformedData);
        }

        // Use apiClient with optional client injection
        return await apiClient.query(async (client) => {
          let query = client.from(tableToQuery).select(select);

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
          query = query.order(orderBy, { ascending });

          // Apply pagination
          if (limit !== undefined) {
            const from = offset || 0;
            const to = from + limit - 1;
            query = query.range(from, to);
          }

          const { data, error } = await query;
          
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
     * Get all entities with tags included
     */
    async getAllWithTags(queryOptions: {
      filters?: Record<string, any>;
      search?: string;
      searchColumns?: string[];
      orderBy?: string;
      ascending?: boolean;
      limit?: number;
      offset?: number;
    } = {}): Promise<ApiResponse<T[]>> {
      if (!withTagsView) {
        // Fallback to regular getAll if no tags view is available
        return this.getAll(queryOptions);
      }

      return this.getAll({
        ...queryOptions,
        includeTags: true,
        select: "*" // Get all columns including tags from the view
      });
    },

    /**
     * Get entities by tag ID using the new aggregated structure
     */
    async getByTagId(tagId: string, queryOptions: {
      search?: string;
      searchColumns?: string[];
      orderBy?: string;
      ascending?: boolean;
      limit?: number;
      offset?: number;
    } = {}): Promise<ApiResponse<T[]>> {
      if (!withTagsView) {
        return createSuccessResponse([]);
      }

      try {
        return await apiClient.query(async (client) => {
          const {
            search,
            searchColumns = ['name'],
            orderBy = defaultOrderBy,
            ascending = false,
            limit,
            offset
          } = queryOptions;

          // Use array contains operator to find entities with the specific tag
          let query = client
            .from(withTagsView)
            .select("*")
            .contains('tags', [{ id: tagId }]);

          // Apply search if provided
          if (search && searchColumns.length > 0) {
            query = query.ilike(searchColumns[0], `%${search}%`);
          }

          // Apply ordering
          query = query.order(orderBy, { ascending });

          // Apply pagination
          if (limit !== undefined) {
            const from = offset || 0;
            const to = from + limit - 1;
            query = query.range(from, to);
          }

          const { data, error } = await query;
          
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
     * Get entity by ID with tags included
     */
    async getByIdWithTags(id: TId): Promise<ApiResponse<T | null>> {
      if (!withTagsView) {
        return this.getById(id);
      }

      try {
        return await apiClient.query(async (client) => {
          const { data, error } = await client
            .from(withTagsView)
            .select("*")
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
