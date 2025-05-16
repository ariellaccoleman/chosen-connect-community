
import { ApiOperations } from "../types";
import { createBaseOperations } from "./baseOperations";
import { createBatchOperations } from "./operations/batchOperations";
import { ApiFactoryOptions, TableNames } from "./types";
import { createQueryOperations } from "./operations/queryOperations";
import { createMutationOperations } from "./operations/mutationOperations";
import { createRepository, DataRepository } from "../repository/repositoryFactory";

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
   * Repository instance or factory function
   */
  repository?: DataRepository<T> | (() => DataRepository<T>);
}

/**
 * Creates a complete API factory with all operations
 * 
 * @param config - Configuration for the API factory
 * @returns API operations for the entity
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
  repository?: DataRepository<T> | (() => DataRepository<T>);
  useQueryOperations?: boolean;
  useMutationOperations?: boolean;
  useBatchOperations?: boolean;
} & ApiFactoryOptions<T>): ApiOperations<T, TId, TCreate, TUpdate> {
  // Validate tableName is defined
  if (!tableName) {
    throw new Error('tableName is required to create API operations');
  }
  
  // Use provided repository or create one
  const dataRepository = typeof repository === 'function'
    ? repository()
    : repository || createRepository<T>(tableName as string);
  
  // Use entityName or generate from tableName (with safety check)
  const entity = entityName || 
    (typeof tableName === 'string' ? 
      tableName.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) : 
      'Entity');
  
  // Base operations are always included
  const baseOps = createBaseOperations<T, TId, TCreate, TUpdate, Table>(
    entity,
    tableName,
    {
      ...options,
      repository: dataRepository
    }
  );
  
  // Create a result object with baseOps and tableName
  const result = {
    ...baseOps,
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
