
import { ApiOperations } from "../types";
import { createBaseOperations } from "./baseOperations";
import { createBatchOperations } from "./operations/batchOperations";
import { createMutationOperations } from "./operations/mutationOperations";
import { 
  createRepository, 
  createEnhancedRepository,
  DataRepository
} from "../repository";
import { ApiFactoryConfig, RepositoryConfig, TableNames, StandardApiFactoryConfig } from "./apiFactoryTypes";

/**
 * Creates a standard API factory with full CRUD operations that support client injection
 * 
 * @param config - Configuration for the API factory
 * @param providedClient - Optional Supabase client for testing/custom usage
 * @returns API operations for the entity with client injection support
 */
export function createStandardApiFactory<
  T, 
  TId = string, 
  TCreate = Partial<T>, 
  TUpdate = Partial<T>,
  Table extends TableNames = TableNames
>(
  config: StandardApiFactoryConfig<T> & { tableName: Table },
  providedClient?: any
): ApiOperations<T, TId, TCreate, TUpdate> {
  const {
    tableName,
    entityName,
    repository,
    useMutationOperations = false,
    useBatchOperations = false,
    ...options
  } = config;

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
        // Handle different repository types properly
        if (repoConfig.type === 'supabase') {
          dataRepository = createEnhancedRepository<T>(
            tableName as string, 
            'supabase',
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
          // For mock type, use a regular repository with initial data
          dataRepository = createRepository<T>(
            tableName as string,
            { schema: 'public' },
            providedClient
          );
        }
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
      (tableName as string).replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) : 
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
 * Alias for createStandardApiFactory for backwards compatibility
 */
export const createApiOperations = createStandardApiFactory;

