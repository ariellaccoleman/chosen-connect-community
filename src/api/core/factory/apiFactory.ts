import { ApiOperations } from "../types";
import { createBaseOperations } from "./baseOperations";
import { createBatchOperations } from "./operations/batchOperations";
import { ApiFactoryOptions, TableNames, ViewNames, ViewFactoryOptions, ViewOperations } from "./types";
import { createMutationOperations } from "./operations/mutationOperations";
import { 
  createRepository, 
  createEnhancedRepository,
  DataRepository, 
  EnhancedRepositoryType 
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
 * Create a client-aware repository wrapper that can use either repository or direct client access
 */
function createClientAwareRepository<T>(
  baseRepository: DataRepository<T>, 
  tableName: string,
  providedClient?: any
): DataRepository<T> {
  if (!providedClient) {
    return baseRepository;
  }
  
  // Return a repository-like interface that uses the provided client
  return {
    ...baseRepository,
    select: (columns: string = '*') => {
      let query = providedClient.from(tableName).select(columns);
      return {
        ...query,
        eq: (column: string, value: any) => {
          query = query.eq(column, value);
          return { ...query, execute: () => query, maybeSingle: () => query.maybeSingle() };
        },
        in: (column: string, values: any[]) => {
          query = query.in(column, values);
          return { ...query, execute: () => query };
        },
        ilike: (column: string, pattern: string) => {
          query = query.ilike(column, pattern);
          return { ...query, execute: () => query };
        },
        order: (column: string, options: any) => {
          query = query.order(column, options);
          return { ...query, execute: () => query };
        },
        range: (from: number, to: number) => {
          query = query.range(from, to);
          return { ...query, execute: () => query };
        },
        execute: () => query,
        single: () => query.single(),
        maybeSingle: () => query.maybeSingle()
      };
    },
    insert: (data: any) => {
      let query = providedClient.from(tableName).insert(data);
      return {
        ...query,
        select: (columns: string = '*') => {
          query = query.select(columns);
          return { ...query, execute: () => query, single: () => query.single() };
        },
        execute: () => query,
        single: () => query.single()
      };
    },
    update: (data: any) => {
      let query = providedClient.from(tableName).update(data);
      return {
        ...query,
        eq: (column: string, value: any) => {
          query = query.eq(column, value);
          return { 
            ...query, 
            select: (columns: string = '*') => {
              query = query.select(columns);
              return { ...query, execute: () => query, single: () => query.single() };
            },
            execute: () => query, 
            single: () => query.single() 
          };
        },
        execute: () => query,
        single: () => query.single()
      };
    },
    delete: () => {
      let query = providedClient.from(tableName).delete();
      return {
        ...query,
        eq: (column: string, value: any) => {
          query = query.eq(column, value);
          return { 
            ...query, 
            select: (columns: string = '*') => {
              query = query.select(columns);
              return { ...query, execute: () => query };
            },
            execute: () => query 
          };
        },
        in: (column: string, values: any[]) => {
          query = query.in(column, values);
          return { ...query, execute: () => query };
        },
        execute: () => query
      };
    }
  } as DataRepository<T>;
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
          }
        );
      } else {
        dataRepository = createRepository<T>(
          tableName as string, 
          { schema: 'public' }
        );
      }
    }
  } else {
    // Create default repository
    dataRepository = createRepository<T>(tableName as string);
  }
  
  // Create client-aware repository that can handle both repository and direct client access
  const clientAwareRepository = createClientAwareRepository(dataRepository, tableName as string, providedClient);
  
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
      repository: clientAwareRepository
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
        repository: clientAwareRepository
      },
      providedClient
    );
    Object.assign(result, mutationOps);
  }
  
  // Add batch operations if requested
  if (useBatchOperations) {
    const batchOps = createBatchOperations<T, TId, TCreate, TUpdate, Table>(
      entity,
      tableName,
      {
        idField: options.idField,
        defaultSelect: options.defaultSelect,
        transformResponse: options.transformResponse,
        transformRequest: options.transformRequest,
        repository: clientAwareRepository
      },
      providedClient
    );
    Object.assign(result, batchOps);
  }
  
  return result;
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
  repository,
  ...options
}: {
  viewName: View;
  entityName?: string;
  repository?: DataRepository<T> | (() => DataRepository<T>) | RepositoryConfig<T>;
} & ViewFactoryOptions<T>, providedClient?: any): ViewOperations<T, TId> {
  // Validate viewName is defined
  if (!viewName) {
    throw new Error('viewName is required to create view operations');
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
          viewName as string, 
          repoConfig.type,
          repoConfig.initialData,
          {
            idField: options.idField,
            defaultSelect: options.defaultSelect,
            transformResponse: options.transformResponse,
            softDelete: false, // Views don't support soft delete
            enableLogging: repoConfig.enableLogging
          }
        );
      } else {
        dataRepository = createRepository<T>(
          viewName as string, 
          { schema: 'public' }
        );
      }
    }
  } else {
    // Create default repository for view
    dataRepository = createRepository<T>(viewName as string);
  }
  
  // Create client-aware repository that can handle both repository and direct client access
  const clientAwareRepository = createClientAwareRepository(dataRepository, viewName as string, providedClient);
  
  // Use entityName or generate from viewName (with safety check)
  const entity = entityName || 
    (typeof viewName === 'string' ? 
      viewName.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) : 
      'ViewEntity');
  
  // Create base operations for read-only access
  const baseOps = createBaseOperations<T, TId, never, never, any>(
    entity,
    viewName as any, // Cast to satisfy the generic constraint
    {
      ...options,
      repository: clientAwareRepository
    },
    providedClient
  );
  
  // Return only read operations and view name
  return {
    getAll: baseOps.getAll,
    getById: baseOps.getById,
    getByIds: baseOps.getByIds,
    viewName: viewName as string
  } as ViewOperations<T, TId>;
}

/**
 * Alias for createApiFactory for backwards compatibility
 */
export const createApiOperations = createApiFactory;

export * from "./types";
