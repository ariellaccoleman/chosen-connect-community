
import { logger } from "@/utils/logger";
import { apiClient } from "../../apiClient";
import { createSuccessResponse, createErrorResponse } from "../../errorHandler";
import { ApiResponse } from "../../types";
import { TableNames } from "../types";
import { DataRepository } from "../../repository/DataRepository";

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
 * Creates standardized query operations (read operations) for an entity
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
  // Set default options
  const {
    idField = 'id',
    defaultSelect = '*',
    defaultOrderBy = 'created_at',
    transformResponse = (item) => item as T,
    repository: repoOption
  } = options;

  // Resolve repository (handle both direct instances and factory functions)
  const repository = typeof repoOption === 'function' ? repoOption() : repoOption;

  // Type assertion for string fields
  const typedIdField = idField as string;
  const typedDefaultOrderBy = defaultOrderBy as string;

  /**
   * Get all entities with optional filtering and pagination
   */
  const getAll = async (params?: any): Promise<ApiResponse<T[]>> => {
    try {
      logger.debug(`Fetching all ${entityName}`, params);
      
      // Use repository if provided, otherwise use apiClient with optional client injection
      if (repository) {
        // Start with select query
        let query = repository.select(defaultSelect);
        
        // Apply filters if provided
        if (params?.filters) {
          Object.entries(params.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                query = query.in(key, value as any[]);
              } else {
                query = query.eq(key, value as any);
              }
            }
          });
        }
        
        // Apply search if provided
        if (params?.search) {
          query = query.ilike('name', `%${params.search}%`);
        }
        
        // Apply pagination
        if (params?.page !== undefined && params?.limit !== undefined) {
          const start = (params.page - 1) * params.limit;
          query = query.range(start, start + params.limit - 1);
        }
        
        // Apply sorting
        const sortField = params?.sortBy ? params.sortBy : typedDefaultOrderBy;
        const sortOrder = params?.sortDirection || 'desc';
        query = query.order(sortField, { ascending: sortOrder === 'asc' });
        
        // Execute the query
        const result = await query.execute();
        
        if (result.error) throw result.error;
        
        // Transform response data
        const transformedData = result.data ? result.data.map(transformResponse) : [];
        
        return createSuccessResponse(transformedData);
      }
      
      // Use apiClient with optional client injection
      return await apiClient.query(async (client) => {
        // Type-safe table access
        const query = client.from(tableName);
        let selectQuery = query.select(defaultSelect);
        
        // Apply filters if provided
        if (params?.filters) {
          Object.entries(params.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                selectQuery = selectQuery.in(key, value as any);
              } else {
                selectQuery = selectQuery.eq(key, value as any);
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
        const sortField = params?.sortBy || typedDefaultOrderBy;
        const sortOrder = params?.sortDirection || 'desc';
        const ascending = sortOrder === 'asc';
        
        selectQuery = selectQuery.order(sortField, { ascending });
        
        // Execute the query
        const { data, error } = await selectQuery;
        if (error) throw error;
        
        // Transform response data
        const transformedData = data ? data.map(transformResponse) : [];
        return createSuccessResponse(transformedData);
      }, providedClient);
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
      
      // Use repository if provided, otherwise use apiClient with optional client injection
      if (repository) {
        const result = await repository
          .select(defaultSelect)
          .eq(typedIdField, id as any)
          .maybeSingle();
          
        if (result.error) throw result.error;
        
        // Return null if no entity is found
        if (!result.data) return createSuccessResponse(null);
        
        return createSuccessResponse(transformResponse(result.data));
      }
      
      // Use apiClient with optional client injection
      return await apiClient.query(async (client) => {
        const { data, error } = await client
          .from(tableName)
          .select(defaultSelect)
          .eq(typedIdField, id as any)
          .maybeSingle();
          
        if (error) throw error;
        
        // Return null if no entity is found
        if (!data) return createSuccessResponse(null);
        
        return createSuccessResponse(transformResponse(data));
      }, providedClient);
    } catch (error) {
      logger.error(`Error fetching ${entityName}:`, error);
      return createErrorResponse(error);
    }
  };

  /**
   * Get multiple entities by IDs
   */
  const getByIds = async (ids: TId[]): Promise<ApiResponse<T[]>> => {
    try {
      logger.debug(`Fetching ${entityName} with IDs: ${ids.join(', ')}`);
      
      if (ids.length === 0) {
        return createSuccessResponse([]);
      }
      
      // Use repository if provided, otherwise use apiClient with optional client injection
      if (repository) {
        const result = await repository
          .select(defaultSelect)
          .in(typedIdField, ids as any[])
          .execute();
          
        if (result.error) throw result.error;
        
        const transformedData = result.data ? result.data.map(transformResponse) : [];
        
        return createSuccessResponse(transformedData);
      }
      
      // Use apiClient with optional client injection
      return await apiClient.query(async (client) => {
        const { data, error } = await client
          .from(tableName)
          .select(defaultSelect)
          .in(typedIdField, ids as any[]);
          
        if (error) throw error;
        
        const transformedData = data ? data.map(item => transformResponse(item as any)) : [];
        
        return createSuccessResponse(transformedData);
      }, providedClient);
    } catch (error) {
      logger.error(`Error fetching ${entityName} by IDs:`, error);
      return createErrorResponse(error);
    }
  };

  /**
   * Find a single entity by exact name match
   */
  const findByName = async (name: string, filters?: any): Promise<ApiResponse<T | null>> => {
    try {
      logger.debug(`Finding ${entityName} by name: ${name}`);
      
      // Use repository if provided, otherwise use apiClient
      if (repository) {
        let query = repository.select(defaultSelect).eq('name', name);
        
        // Apply additional filters if provided
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                query = query.in(key, value as any[]);
              } else {
                query = query.eq(key, value as any);
              }
            }
          });
        }
        
        const result = await query.maybeSingle();
        
        if (result.error) throw result.error;
        
        return createSuccessResponse(result.data ? transformResponse(result.data) : null);
      }
      
      // Legacy implementation using apiClient
      return await apiClient.query(async (client) => {
        let selectQuery = client.from(tableName).select(defaultSelect).eq('name', name);
        
        // Apply additional filters if provided
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                selectQuery = selectQuery.in(key, value as any);
              } else {
                selectQuery = selectQuery.eq(key, value as any);
              }
            }
          });
        }
        
        const { data, error } = await selectQuery.maybeSingle();
        if (error) throw error;
        
        return createSuccessResponse(data ? transformResponse(data) : null);
      });
    } catch (error) {
      logger.error(`Error finding ${entityName} by name:`, error);
      return createErrorResponse(error);
    }
  };

  /**
   * Search entities using case-insensitive pattern matching on name field
   */
  const searchByName = async (searchQuery: string, filters?: any): Promise<ApiResponse<T[]>> => {
    try {
      logger.debug(`Searching ${entityName} by name: ${searchQuery}`);
      
      // Use repository if provided, otherwise use apiClient
      if (repository) {
        let query = repository.select(defaultSelect).ilike('name', `%${searchQuery}%`);
        
        // Apply additional filters if provided
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                query = query.in(key, value as any[]);
              } else {
                query = query.eq(key, value as any);
              }
            }
          });
        }
        
        // Apply default ordering
        query = query.order('name', { ascending: true });
        
        const result = await query.execute();
        
        if (result.error) throw result.error;
        
        const transformedData = result.data ? result.data.map(transformResponse) : [];
        return createSuccessResponse(transformedData);
      }
      
      // Legacy implementation using apiClient
      return await apiClient.query(async (client) => {
        let selectQuery = client.from(tableName).select(defaultSelect).ilike('name', `%${searchQuery}%`);
        
        // Apply additional filters if provided
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                selectQuery = selectQuery.in(key, value as any);
              } else {
                selectQuery = selectQuery.eq(key, value as any);
              }
            }
          });
        }
        
        // Apply default ordering
        selectQuery = selectQuery.order('name', { ascending: true });
        
        const { data, error } = await selectQuery;
        if (error) throw error;
        
        const transformedData = data ? data.map(transformResponse) : [];
        return createSuccessResponse(transformedData);
      });
    } catch (error) {
      logger.error(`Error searching ${entityName} by name:`, error);
      return createErrorResponse(error);
    }
  };

  /**
   * Get entities filtered by entity type
   */
  const getByEntityType = async (entityType: string, filters?: any): Promise<ApiResponse<T[]>> => {
    try {
      logger.debug(`Getting ${entityName} by entity type: ${entityType}`);
      
      // Use repository if provided, otherwise use apiClient
      if (repository) {
        let query = repository.select(defaultSelect).eq('entity_type', entityType);
        
        // Apply additional filters if provided
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                query = query.in(key, value as any[]);
              } else {
                query = query.eq(key, value as any);
              }
            }
          });
        }
        
        // Apply default ordering
        const sortField = typedDefaultOrderBy;
        query = query.order(sortField, { ascending: false });
        
        const result = await query.execute();
        
        if (result.error) throw result.error;
        
        const transformedData = result.data ? result.data.map(transformResponse) : [];
        return createSuccessResponse(transformedData);
      }
      
      // Legacy implementation using apiClient
      return await apiClient.query(async (client) => {
        let selectQuery = client.from(tableName).select(defaultSelect).eq('entity_type', entityType);
        
        // Apply additional filters if provided
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                selectQuery = selectQuery.in(key, value as any);
              } else {
                selectQuery = selectQuery.eq(key, value as any);
              }
            }
          });
        }
        
        // Apply default ordering
        const sortField = typedDefaultOrderBy;
        selectQuery = selectQuery.order(sortField, { ascending: false });
        
        const { data, error } = await selectQuery;
        if (error) throw error;
        
        const transformedData = data ? data.map(transformResponse) : [];
        return createSuccessResponse(transformedData);
      });
    } catch (error) {
      logger.error(`Error getting ${entityName} by entity type:`, error);
      return createErrorResponse(error);
    }
  };

  return {
    getAll,
    getById,
    getByIds,
    // Add remaining methods that follow the same pattern
    findByName: async (name: string, filters?: any): Promise<ApiResponse<T | null>> => {
      try {
        logger.debug(`Finding ${entityName} by name: ${name}`);
        
        if (repository) {
          let query = repository.select(defaultSelect).eq('name', name);
          
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                  query = query.in(key, value as any[]);
                } else {
                  query = query.eq(key, value as any);
                }
              }
            });
          }
          
          const result = await query.maybeSingle();
          
          if (result.error) throw result.error;
          
          return createSuccessResponse(result.data ? transformResponse(result.data) : null);
        }
        
        return await apiClient.query(async (client) => {
          let selectQuery = client.from(tableName).select(defaultSelect).eq('name', name);
          
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                  selectQuery = selectQuery.in(key, value as any);
                } else {
                  selectQuery = selectQuery.eq(key, value as any);
                }
              }
            });
          }
          
          const { data, error } = await selectQuery.maybeSingle();
          if (error) throw error;
          
          return createSuccessResponse(data ? transformResponse(data) : null);
        }, providedClient);
      } catch (error) {
        logger.error(`Error finding ${entityName} by name:`, error);
        return createErrorResponse(error);
      }
    },
    
    searchByName: async (searchQuery: string, filters?: any): Promise<ApiResponse<T[]>> => {
      try {
        logger.debug(`Searching ${entityName} by name: ${searchQuery}`);
        
        if (repository) {
          let query = repository.select(defaultSelect).ilike('name', `%${searchQuery}%`);
          
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                  query = query.in(key, value as any[]);
                } else {
                  query = query.eq(key, value as any);
                }
              }
            });
          }
          
          query = query.order('name', { ascending: true });
          
          const result = await query.execute();
          
          if (result.error) throw result.error;
          
          const transformedData = result.data ? result.data.map(transformResponse) : [];
          return createSuccessResponse(transformedData);
        }
        
        return await apiClient.query(async (client) => {
          let selectQuery = client.from(tableName).select(defaultSelect).ilike('name', `%${searchQuery}%`);
          
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                  selectQuery = selectQuery.in(key, value as any);
                } else {
                  selectQuery = selectQuery.eq(key, value as any);
                }
              }
            });
          }
          
          selectQuery = selectQuery.order('name', { ascending: true });
          
          const { data, error } = await selectQuery;
          if (error) throw error;
          
          const transformedData = data ? data.map(transformResponse) : [];
          return createSuccessResponse(transformedData);
        }, providedClient);
      } catch (error) {
        logger.error(`Error searching ${entityName} by name:`, error);
        return createErrorResponse(error);
      }
    },
    
    getByEntityType: async (entityType: string, filters?: any): Promise<ApiResponse<T[]>> => {
      try {
        logger.debug(`Getting ${entityName} by entity type: ${entityType}`);
        
        if (repository) {
          let query = repository.select(defaultSelect).eq('entity_type', entityType);
          
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                  query = query.in(key, value as any[]);
                } else {
                  query = query.eq(key, value as any);
                }
              }
            });
          }
          
          const sortField = typedDefaultOrderBy;
          query = query.order(sortField, { ascending: false });
          
          const result = await query.execute();
          
          if (result.error) throw result.error;
          
          const transformedData = result.data ? result.data.map(transformResponse) : [];
          return createSuccessResponse(transformedData);
        }
        
        return await apiClient.query(async (client) => {
          let selectQuery = client.from(tableName).select(defaultSelect).eq('entity_type', entityType);
          
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                  selectQuery = selectQuery.in(key, value as any);
                } else {
                  selectQuery = selectQuery.eq(key, value as any);
                }
              }
            });
          }
          
          const sortField = typedDefaultOrderBy;
          selectQuery = selectQuery.order(sortField, { ascending: false });
          
          const { data, error } = await selectQuery;
          if (error) throw error;
          
          const transformedData = data ? data.map(transformResponse) : [];
          return createSuccessResponse(transformedData);
        }, providedClient);
      } catch (error) {
        logger.error(`Error getting ${entityName} by entity type:`, error);
        return createErrorResponse(error);
      }
    }
  };
}
