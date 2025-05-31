
import { DataRepository } from "../repository";
import { TableNames } from "./types";

/**
 * Repository configuration options
 */
export interface RepositoryConfig<T> {
  enhanced?: boolean;
  type?: 'supabase' | 'mock';
  initialData?: T[];
  enableLogging?: boolean;
}

/**
 * Core configuration for API factories
 */
export interface ApiFactoryConfig<T> {
  idField?: string;
  defaultSelect?: string;
  defaultOrderBy?: string;
  softDelete?: boolean;
  transformResponse?: (item: any) => T;
  transformRequest?: (data: any) => any;
  withTagsView?: string; // Add this property for view-based tag operations
}

/**
 * Configuration for creating standard API operations
 */
export interface StandardApiFactoryConfig<T> extends ApiFactoryConfig<T> {
  tableName: TableNames;
  entityName?: string;
  repository?: DataRepository<T> | (() => DataRepository<T>) | RepositoryConfig<T>;
  useMutationOperations?: boolean;
  useBatchOperations?: boolean;
}
