
import { createBatchOperations as createBatchOps } from "./operations/batchOperations";
import { TableNames } from "./types";

/**
 * Creates standardized batch operations for a specific entity type
 * This is a wrapper around the implementation in operations/batchOperations.ts
 * @deprecated Use the version from operations/batchOperations directly
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
  options: {
    idField?: string;
    defaultSelect?: string;
    transformResponse?: (item: any) => T;
    transformRequest?: (item: any) => Record<string, any>;
    softDelete?: boolean;
    repository?: any; // Allow repository to be passed through
  } = {}
) {
  return createBatchOps<T, TId, TCreate, TUpdate, Table>({
    entityName,
    tableName,
    ...options
  });
}
