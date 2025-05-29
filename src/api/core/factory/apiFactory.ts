
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
 * Create a client-aware repository wrapper that can use either repository or direct client access
 */
function createClientAwareRepository<T>(
  tableName: string,
  providedClient?: any
): DataRepository<T> {
  if (!providedClient) {
    // Return a lazy repository that will be initialized when client is available
    return {
      select: () => {
        throw new Error('Repository requires client to be initialized');
      },
      insert: () => {
        throw new Error('Repository requires client to be initialized');
      },
      update: () => {
        throw new Error('Repository requires client to be initialized');
      },
      delete: () => {
        throw new Error('Repository requires client to be initialized');
      },
      tableName,
      schema: 'public'
    } as DataRepository<T>;
  }
  
  // Return a repository-like interface that uses the provided client
  return {
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
    },
    tableName,
    schema: 'public'
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
  
  // Create lazy repository creation function
  const createLazyRepository = () => {
    if (repository) {
      if (typeof repository === 'function') {
        return repository();
      } else if ('select' in repository && typeof repository.select === 'function') {
        // It's a repository instance
        return repository as DataRepository<T>;
      } else {
        // It's a repository config - create enhanced repository
        const repoConfig = repository as RepositoryConfig<T>;
        
        if (repoConfig.enhanced) {
          return createEnhancedRepository<T>(
            tableName as string, 
            repoConfig.type,
            providedClient,
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
        }
      }
    }
    
    // Create client-aware repository
    return createClientAwareRepository<T>(tableName as string, providedClient);
  };
  
  // Use entityName or generate from tableName (with safety check)
  const entity = entityName || 
    (typeof tableName === 'string' ? 
      tableName.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) : 
      'Entity');
  
  // Base operations are always included - use lazy client resolution
  const baseOps = createBaseOperations<T, TId, TCreate, TUpdate, Table>(
    entity,
    tableName,
    {
      ...options,
      repository: createLazyRepository()
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
        repository: createLazyRepository()
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
        repository: createLazyRepository()
      },
      providedClient
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
  
  // Lazy view repository creation that requires client
  const createLazyViewRepository = async (): Promise<ViewRepository<T>> => {
    const client = providedClient || (await import("@/integrations/supabase/client")).supabase;
    return createViewRepository<T>(
      viewName as string,
      client,
      'public'
    );
  };
  
  // Return view operations that use lazy client resolution
  return {
    async getAll(params) {
      const viewRepo = await createLazyViewRepository();
      return viewRepo.getAll(params);
    },
    async getById(id) {
      const viewRepo = await createLazyViewRepository();
      return viewRepo.getById(id as string);
    },
    async getByIds(ids) {
      const viewRepo = await createLazyViewRepository();
      return viewRepo.getByIds(ids as string[]);
    },
    viewName: viewName as string
  } as ViewOperations<T, TId>;
}
