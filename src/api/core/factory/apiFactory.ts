
import { ApiOperations } from "../types";
import { createBaseOperations } from "./baseOperations";
import { createBatchOperations } from "./operations/batchOperations";
import { ApiFactoryOptions, TableNames } from "./types";
import { createQueryOperations } from "./operations/queryOperations";
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
   * Enable query operations
   */
  useQueryOperations?: boolean;
  
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
  useQueryOperations = false,
  useMutationOperations = false,
  useBatchOperations = false,
  ...options
}: {
  tableName: Table;
  entityName?: string;
  repository?: DataRepository<T> | (() => DataRepository<T>) | RepositoryConfig<T>;
  useQueryOperations?: boolean;
  useMutationOperations?: boolean;
  useBatchOperations?: boolean;
} & ApiFactoryOptions<T>): ApiOperations<T, TId, TCreate, TUpdate> {
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
        // Fix: Pass only two arguments instead of three
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
  
  // Use entityName or generate from tableName (with safety check)
  const entity = entityName || 
    (typeof tableName === 'string' ? 
      tableName.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) : 
      'Entity');
  
  // Base operations are always included - wrap them to support client injection
  const baseOps = createBaseOperations<T, TId, TCreate, TUpdate, Table>(
    entity,
    tableName,
    {
      ...options,
      repository: dataRepository
    }
  );
  
  // Wrap base operations to support providedClient parameter
  const wrappedBaseOps = {
    ...baseOps,
    async getAll(optionsOrClient?: any, providedClient?: any): Promise<any> {
      // Handle both old signature and new signature with client
      const actualClient = providedClient || (typeof optionsOrClient === 'object' && optionsOrClient?.auth ? optionsOrClient : undefined);
      const actualOptions = actualClient ? optionsOrClient : (optionsOrClient || {});
      
      if (actualClient) {
        // Use the provided client by temporarily replacing the repository
        const originalQuery = dataRepository.select;
        dataRepository.select = actualClient.from(tableName).select.bind(actualClient.from(tableName));
        try {
          return await baseOps.getAll(actualOptions);
        } finally {
          dataRepository.select = originalQuery;
        }
      }
      return baseOps.getAll(actualOptions);
    },
    
    async getById(id: TId, providedClient?: any): Promise<any> {
      if (providedClient) {
        const originalQuery = dataRepository.select;
        dataRepository.select = providedClient.from(tableName).select.bind(providedClient.from(tableName));
        try {
          return await baseOps.getById(id);
        } finally {
          dataRepository.select = originalQuery;
        }
      }
      return baseOps.getById(id);
    },
    
    async create(data: TCreate, providedClient?: any): Promise<any> {
      if (providedClient) {
        const originalInsert = dataRepository.insert;
        dataRepository.insert = providedClient.from(tableName).insert.bind(providedClient.from(tableName));
        try {
          return await baseOps.create(data);
        } finally {
          dataRepository.insert = originalInsert;
        }
      }
      return baseOps.create(data);
    },
    
    async update(id: TId, data: TUpdate, providedClient?: any): Promise<any> {
      if (providedClient) {
        const originalUpdate = dataRepository.update;
        dataRepository.update = providedClient.from(tableName).update.bind(providedClient.from(tableName));
        try {
          return await baseOps.update(id, data);
        } finally {
          dataRepository.update = originalUpdate;
        }
      }
      return baseOps.update(id, data);
    },
    
    async delete(id: TId, providedClient?: any): Promise<any> {
      if (providedClient) {
        const originalDelete = dataRepository.delete;
        dataRepository.delete = providedClient.from(tableName).delete.bind(providedClient.from(tableName));
        try {
          return await baseOps.delete(id);
        } finally {
          dataRepository.delete = originalDelete;
        }
      }
      return baseOps.delete(id);
    }
  };
  
  // Create a result object with wrapped operations and tableName
  const result = {
    ...wrappedBaseOps,
    tableName
  } as ApiOperations<T, TId, TCreate, TUpdate>;
  
  // Add query operations if requested
  if (useQueryOperations) {
    const queryOps = createQueryOperations<T, TId, Table>(
      entity,
      tableName,
      {
        idField: options.idField,
        defaultSelect: options.defaultSelect,
        defaultOrderBy: options.defaultOrderBy,
        transformResponse: options.transformResponse,
        repository: dataRepository
      }
    );
    Object.assign(result, queryOps);
  }
  
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
      }
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
        repository: dataRepository
      }
    );
    Object.assign(result, batchOps);
  }
  
  return result;
}

/**
 * Alias for createApiFactory for backwards compatibility
 */
export const createApiOperations = createApiFactory;

export * from "./types";
