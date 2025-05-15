
import { TableNames } from "./types";
import { createQueryOperations } from "./operations/queryOperations";
import { createMutationOperations } from "./operations/mutationOperations";
import { ApiResponse } from "../types";
import { DataRepository } from "../repository/repositoryFactory";

/**
 * Options for creating base operations
 */
interface BaseOperationsOptions<T> {
  idField?: string;
  defaultSelect?: string;
  defaultOrderBy?: string;
  softDelete?: boolean;
  transformResponse?: (item: any) => T;
  transformRequest?: (item: any) => Record<string, any>;
  repository?: DataRepository<T> | (() => DataRepository<T>);
}

/**
 * Creates standardized base CRUD operations for a specific entity type
 */
export function createBaseOperations<
  T,
  TId = string,
  TCreate = Partial<T>,
  TUpdate = Partial<T>,
  Table extends TableNames = TableNames
>(
  entityName: string,
  tableName: Table,
  options: BaseOperationsOptions<T> = {}
) {
  // Create query operations (getAll, getById, getByIds)
  const queryOperations = createQueryOperations<T, TId, Table>(
    entityName, 
    tableName, 
    options
  );
  
  // Create mutation operations (create, update, delete)
  const mutationOperations = createMutationOperations<T, TId, TCreate, TUpdate, Table>(
    entityName,
    tableName,
    options
  );
  
  // Combine all operations
  return {
    ...queryOperations,
    ...mutationOperations
  };
}
