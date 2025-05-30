
import { ApiOperations, RelationshipApiOperations } from "../types";
import { createBaseOperations } from "./baseOperations";
import { createBatchOperations } from "./operations/batchOperations";
import { ApiFactoryOptions, TableNames, ViewNames, ViewFactoryOptions, ViewOperations, RelationshipFactoryOptions } from "./types";
import { createMutationOperations } from "./operations/mutationOperations";
import { 
  createRepository, 
  createEnhancedRepository,
  DataRepository, 
  EnhancedRepositoryType,
  ViewRepository,
  createViewRepository
} from "../repository";

/**
 * Repository configuration
 */
export interface RepositoryConfig<T = any> {
  /**
   * Repository type (supabase, mock)
   */
  type: EnhancedRepositoryType;
  
  /**
   * Initial data for mock repository
   */
  initialData?: T[];
  
  /**
   * Enable enhanced repository features
   */
  enhanced?: boolean;
  
  /**
   * Enable logging for repository operations (development only)
   */
  enableLogging?: boolean;
}

/**
 * Enhanced API Factory options with repository support
 */
export interface ApiFactoryConfig<T> extends Omit<ApiFactoryOptions<T>, 'repository'> {
  /**
   * Enable mutation operations
   */
  useMutationOperations?: boolean;
  
  /**
   * Enable batch operations
   */
  useBatchOperations?: boolean;
  
  /**
   * Repository instance, factory function or configuration
   */
  repository?: DataRepository<T> | (() => DataRepository<T>) | RepositoryConfig<T>;
}

/**
 * Creates a complete API factory with all operations that support client injection
 * 
 * @param config - Configuration for the API factory
 * @param providedClient - Optional Supabase client for testing/custom usage
 * @returns API operations for the entity with client injection support
 */
export function createApiFactory<
  T, 
  TId = string, 
  TCreate = Partial<T>, 
  TUpdate = Partial<T>,
  Table extends TableNames = TableNames
>({
  tableName,
  entityName,
  repository,
  useMutationOperations = false,
  useBatchOperations = false,
  ...options
}: {
  tableName: Table;
  entityName?: string;
  repository?: DataRepository<T> | (() => DataRepository<T>) | RepositoryConfig<T>;
  useMutationOperations?: boolean;
  useBatchOperations?: boolean;
} & ApiFactoryOptions<T>, providedClient?: any): ApiOperations<T, TId, TCreate, TUpdate> {
  // Validate tableName is defined
  if (!tableName) {
    throw new Error('tableName is required to create API operations');
  }
  
  // Get repository based on provided options
  let dataRepository: DataRepository<T>;
  
  if (repository) {
    if (typeof repository === 'function') {
      dataRepository = repository();
    } else if ('select' in repository && typeof repository.select === 'function') {
      // It's a repository instance
      dataRepository = repository as DataRepository<T>;
    } else {
      // It's a repository config
      const repoConfig = repository as RepositoryConfig<T>;
      
      if (repoConfig.enhanced) {
        dataRepository = createEnhancedRepository<T>(
          tableName as string, 
          repoConfig.type,
          repoConfig.initialData,
          {
            idField: options.idField,
            defaultSelect: options.defaultSelect,
            transformResponse: options.transformResponse,
            transformRequest: options.transformRequest,
            softDelete: options.softDelete,
            enableLogging: repoConfig.enableLogging
          },
          providedClient // Pass the provided client to the enhanced repository
        );
      } else {
        dataRepository = createRepository<T>(
          tableName as string, 
          { schema: 'public' },
          providedClient // Pass the provided client to the repository
        );
      }
    }
  } else {
    // Create default repository with the provided client
    dataRepository = createRepository<T>(
      tableName as string,
      { schema: 'public' },
      providedClient // Pass the provided client to the repository
    );
  }
  
  // Use entityName or generate from tableName (with safety check)
  const entity = entityName || 
    (typeof tableName === 'string' ? 
      tableName.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) : 
      'Entity');
  
  // Base operations are always included - includes query operations by default
  const baseOps = createBaseOperations<T, TId, TCreate, TUpdate, Table>(
    entity,
    tableName,
    {
      ...options,
      repository: dataRepository
    },
    providedClient
  );
  
  // Create a result object with base operations and tableName
  const result = {
    ...baseOps,
    tableName
  } as ApiOperations<T, TId, TCreate, TUpdate>;
  
  // Add mutation operations if requested
  if (useMutationOperations) {
    const mutationOps = createMutationOperations<T, TId, TCreate, TUpdate, Table>(
      entity,
      tableName,
      {
        idField: options.idField,
        defaultSelect: options.defaultSelect,
        softDelete: options.softDelete,
        transformResponse: options.transformResponse,
        transformRequest: options.transformRequest,
        repository: dataRepository
      },
      providedClient
    );
    Object.assign(result, mutationOps);
  }
  
  // Add batch operations if requested
  if (useBatchOperations) {
    const batchOps = createBatchOperations<T, TId, TCreate, TUpdate, Table>(
      dataRepository,
      entity
    );
    Object.assign(result, batchOps);
  }
  
  return result;
}

/**
 * Creates a relationship API factory with standard RUD operations (no generic create)
 * Foundation for relationship-specific extensions
 * 
 * @param config - Configuration for the relationship API factory
 * @param providedClient - Optional Supabase client for testing/custom usage
 * @returns Relationship API operations with standard RUD operations
 */
export function createRelationshipApiFactory<
  T, 
  TId = string, 
  TCreate = Partial<T>, 
  TUpdate = Partial<T>,
  Table extends TableNames = TableNames
>({
  tableName,
  entityName,
  repository,
  useMutationOperations = true, // Enable mutations by default for relationships
  useBatchOperations = false,
  ...options
}: {
  tableName: Table;
  entityName?: string;
  repository?: DataRepository<T> | (() => DataRepository<T>) | RepositoryConfig<T>;
  useMutationOperations?: boolean;
  useBatchOperations?: boolean;
} & RelationshipFactoryOptions<T>, providedClient?: any): RelationshipApiOperations<T, TId, TCreate, TUpdate> {
  // Create the full API operations first
  const fullApiOps = createApiFactory<T, TId, TCreate, TUpdate, Table>({
    tableName,
    entityName,
    repository,
    useMutationOperations,
    useBatchOperations,
    ...options
  }, providedClient);
  
  // Return only the relationship operations (omitting generic create)
  const {
    create, // Remove the generic create method
    ...relationshipOps
  } = fullApiOps;
  
  return relationshipOps as RelationshipApiOperations<T, TId, TCreate, TUpdate>;
}

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

/**
 * Alias for createApiFactory for backwards compatibility
 */
export const createApiOperations = createApiFactory;

export * from "./types";
