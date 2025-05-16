
/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please update imports to use modules from '@/api/core/factory/operations/batchOperations' directly.
 */

import { createBatchOperations as createBatchOps } from "./operations/batchOperations";
import { TableNames } from "./types";

/**
 * Creates standardized batch operations for a specific entity type
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
  // Add deprecation console warning in development only
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'Deprecated import: createBatchOperations is deprecated. ' +
      'Please use createBatchOperations from @/api/core/factory/operations/batchOperations directly.'
    );
  }
  
  return createBatchOps<T, TId, TCreate, TUpdate, Table>(
    entityName,
    tableName,
    options
  );
}
