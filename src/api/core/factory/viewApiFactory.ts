
import { ViewOperations } from "./types";
import { ViewRepository, createViewRepository } from "../repository";
import { ViewNames, ViewFactoryOptions } from "./apiFactoryTypes";

/**
 * Creates a view-only API factory with read operations that support client injection
 * 
 * @param config - Configuration for the view factory
 * @param providedClient - Optional Supabase client for testing/custom usage
 * @returns View operations for read-only access with client injection support
 */
export function createViewApiFactory<
  T, 
  TId = string,
  View extends ViewNames = ViewNames
>({
  viewName,
  entityName,
  ...options
}: {
  viewName: View;
  entityName?: string;
} & ViewFactoryOptions<T>, providedClient?: any): ViewOperations<T, TId> {
  // Validate viewName is defined
  if (!viewName) {
    throw new Error('viewName is required to create view operations');
  }
  
  // Create ViewRepository instance with proper client injection
  const viewRepository: ViewRepository<T> = createViewRepository<T>(
    viewName as string,
    providedClient, // Pass the provided client here
    'public'
  );
  
  // Set repository options if provided
  if (options.idField || options.defaultSelect || options.transformResponse || options.enableLogging) {
    viewRepository.setOptions({
      idField: options.idField || 'id',
      defaultSelect: options.defaultSelect || '*',
      transformResponse: options.transformResponse,
      enableLogging: options.enableLogging || false
    });
  }
  
  // Use entityName or generate from viewName (with safety check)
  const entity = entityName || 
    (typeof viewName === 'string' ? 
      viewName.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) : 
      'ViewEntity');
  
  // Create view operations using the ViewRepository
  const viewOperations: ViewOperations<T, TId> = {
    /**
     * Get all records from the view
     */
    async getAll(params: {
      filters?: Record<string, any>;
      search?: string;
      searchColumns?: string[];
      ascending?: boolean;
      limit?: number;
      offset?: number;
      select?: string;
    } = {}) {
      const {
        filters = {},
        ascending = false,
        limit,
        offset,
        select = '*'
      } = params;

      let query = viewRepository.select(select);
      
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
      
      // Apply ordering
      if (options.defaultOrderBy) {
        query = query.order(options.defaultOrderBy, { ascending });
      }
      
      // Apply pagination
      if (limit) {
        query = query.limit(limit);
      }
      
      if (offset) {
        query = query.offset(offset);
      }
      
      const result = await query.execute();
      
      if (result.isError()) {
        throw new Error(result.getErrorMessage());
      }
      
      // Apply transform function to each item if provided
      let transformedData = result.data || [];
      if (options.transformResponse && Array.isArray(transformedData)) {
        transformedData = transformedData.map(item => options.transformResponse!(item));
      }
      
      return {
        data: transformedData,
        error: null,
        status: 'success' as const
      };
    },

    /**
     * Get a record by ID from the view
     */
    async getById(id: TId) {
      const record = await viewRepository.getById(id as string | number);
      
      // Apply transform function if provided
      let transformedRecord: T | null = record;
      if (options.transformResponse && record) {
        transformedRecord = options.transformResponse(record);
      }
      
      return {
        data: transformedRecord,
        error: null,
        status: 'success' as const
      };
    },

    /**
     * Get multiple records by IDs from the view
     */
    async getByIds(ids: TId[]) {
      const query = viewRepository.select().in('id', ids as (string | number)[]);
      const result = await query.execute();
      
      if (result.isError()) {
        throw new Error(result.getErrorMessage());
      }
      
      // Apply transform function to each item if provided
      let transformedData = result.data || [];
      if (options.transformResponse && Array.isArray(transformedData)) {
        transformedData = transformedData.map(item => options.transformResponse!(item));
      }
      
      return {
        data: transformedData,
        error: null,
        status: 'success' as const
      };
    },

    viewName: viewName as string
  };
  
  return viewOperations;
}
