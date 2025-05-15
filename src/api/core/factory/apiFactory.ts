
import { ApiOperations } from "../types";
import { createBaseOperations } from "./baseOperations";
import { createBatchOperations } from "./batchOperations";
import { ApiFactoryOptions, TableNames } from "./types";

/**
 * Creates standardized CRUD API operations for a specific entity type
 * 
 * @param entityName - Name of the entity for logging and error messages
 * @param tableName - Database table name
 * @param options - Additional options for customizing behavior
 * @returns Object with standardized CRUD operations
 */
export function createApiOperations<
  T, 
  TId = string, 
  TCreate = Partial<T>, 
  TUpdate = Partial<T>,
  Table extends TableNames = TableNames
>(
  entityName: string,
  tableName: Table,
  options: ApiFactoryOptions<T> = {}
): ApiOperations<T, TId, TCreate, TUpdate> {
  // Create base operations (getAll, getById, getByIds, create, update, delete)
  const baseOperations = createBaseOperations<T, TId, TCreate, TUpdate, Table>(
    entityName,
    tableName,
    options
  );
  
  // Create batch operations (batchCreate, batchUpdate, batchDelete)
  const batchOperations = createBatchOperations<T, TId, TCreate, TUpdate, Table>(
    entityName,
    tableName,
    options
  );
  
  // Combine all operations
  return {
    ...baseOperations,
    ...batchOperations
  };
}

export * from "./types";
