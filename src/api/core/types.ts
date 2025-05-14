
/**
 * Common parameters for list queries
 */
export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

/**
 * Common filters used across APIs
 */
export interface CommonFilters {
  ids?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
}

/**
 * Common response format for list endpoints
 */
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageCount: number;
  page: number;
  hasMore: boolean;
}

// Import ApiResponse type from errorHandler
import { ApiResponse } from './errorHandler';

/**
 * Standard CRUD operations interface for API factories
 */
export interface ApiOperations<T, TId = string, TCreate = Partial<T>, TUpdate = Partial<T>> {
  // Read operations
  getAll: (params?: ListParams) => Promise<ApiResponse<T[]>>;
  getById: (id: TId) => Promise<ApiResponse<T | null>>;
  getByIds: (ids: TId[]) => Promise<ApiResponse<T[]>>;
  
  // Write operations
  create: (data: TCreate) => Promise<ApiResponse<T>>;
  update: (id: TId, data: TUpdate) => Promise<ApiResponse<T>>;
  delete: (id: TId) => Promise<ApiResponse<boolean>>;
  
  // Batch operations
  batchCreate?: (data: TCreate[]) => Promise<ApiResponse<T[]>>;
  batchUpdate?: (items: {id: TId, data: TUpdate}[]) => Promise<ApiResponse<T[]>>;
  batchDelete?: (ids: TId[]) => Promise<ApiResponse<boolean>>;
}

/**
 * Options for query customization
 */
export interface QueryOptions {
  select?: string[];
  include?: string[];
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Logical operators for filters
 */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like' | 'ilike';

/**
 * Filter definition
 */
export interface FilterDef {
  field: string;
  operator: FilterOperator;
  value: any;
}

/**
 * Extended API Response with pagination
 */
export interface PaginatedApiResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
    hasMore: boolean;
  };
  error: any;
  status: 'success' | 'error';
}
