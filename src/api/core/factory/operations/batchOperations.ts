import { TableNames } from "../types";
import { ApiResponse, createSuccessResponse } from "../../errorHandler";
import { DataRepository } from "../../repository/repositoryFactory";

/**
 * Options for creating batch operations
 */
interface BatchOperationsOptions<T> {
  idField?: string;
  defaultSelect?: string;
  transformResponse?: (item: any) => T;
  transformRequest?: (item: any) => Record<string, any>;
  repository?: DataRepository<T> | (() => DataRepository<T>);
}

/**
 * Creates standardized batch operations for a specific entity type
 * Supports client injection for testing
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
  options: BatchOperationsOptions<T> = {},
  providedClient?: any
) {
  const {
    idField = 'id',
    defaultSelect = '*',
    transformResponse,
    transformRequest
  } = options;

  // Get repository - either provided or create one with client
  const getRepository = () => {
    if (options.repository) {
      if (typeof options.repository === 'function') {
        return options.repository();
      }
      return options.repository;
    }
    
    // Create a basic repository using the provided client or lazy client resolution
    if (providedClient) {
      return createRepository<T>(tableName as string, providedClient);
    }
    
    throw new Error(`Repository or client required for batch operations on ${tableName}`);
  };

  /**
   * Create multiple entities at once
   */
  const batchCreate = async (items: TCreate[]): Promise<ApiResponse<T[]>> => {
    try {
      const repository = getRepository();
      
      // Transform items if transformer provided
      const transformedItems = transformRequest 
        ? items.map(transformRequest)
        : items;

      const query = repository
        .insert(transformedItems)
        .select(defaultSelect);

      const { data, error } = await query;

      if (error) throw error;

      // Transform response if transformer provided
      const transformedData = transformResponse && data 
        ? data.map(transformResponse)
        : data;

      return createSuccessResponse(transformedData || []);
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        status: 'error'
      };
    }
  };

  /**
   * Update multiple entities at once
   */
  const batchUpdate = async (items: { id: TId; data: TUpdate }[]): Promise<ApiResponse<T[]>> => {
    try {
      const repository = getRepository();
      
      const transformedItems = items.map(item => ({
        id: item.id,
        data: transformRequest ? transformRequest(item.data) : item.data
      }));

      // Execute all updates in parallel
      const updatePromises = transformedItems.map(async (item) => {
        return repository
          .update(item.data)
          .eq(idField, item.id)
          .select(defaultSelect)
          .single();
      });

      const results = await Promise.all(updatePromises);

      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(errors.map(err => err.error.message).join('\n'));
      }

      // Extract data
      const data = results.map(result => result.data);

      // Transform response if transformer provided
      const transformedData = transformResponse && data
        ? data.map(transformResponse)
        : data;

      return createSuccessResponse(transformedData || []);
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        status: 'error'
      };
    }
  };

  /**
   * Delete multiple entities at once
   */
  const batchDelete = async (ids: TId[]): Promise<ApiResponse<boolean>> => {
    try {
      const repository = getRepository();
      
      // Execute all deletes in parallel
      const deletePromises = ids.map(id =>
        repository
          .delete()
          .eq(idField, id)
          .select(defaultSelect)
          .execute()
      );

      const results = await Promise.all(deletePromises);

      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(errors.map(err => err.error.message).join('\n'));
      }

      return createSuccessResponse(true);
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        status: 'error'
      };
    }
  };

  return {
    batchCreate,
    batchUpdate,
    batchDelete
  };
}

// Import createRepository function
async function createRepository<T>(tableName: string, client: any): Promise<DataRepository<T>> {
  const { createRepository: createRepo } = await import("../../repository/repositoryFactory");
  return createRepo<T>(tableName, client);
}
