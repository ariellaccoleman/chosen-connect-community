
import { ApiError } from "./errorHandler";

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
  query?: string; // Added this property to support custom SQL queries
  include?: string; // Added for Supabase relationship inclusion
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

/**
 * Standardized API response type
 */
export type ApiResponse<T> = {
  data: T | null;
  error: ApiError | null;
  status: 'success' | 'error';
  isSuccess: () => boolean;
  isError: () => boolean;
};

/**
 * Base API operations interface for all entity types
 */
export interface BaseApiOperations<T, TId = string, TCreate = Partial<T>, TUpdate = Partial<T>> {
  // Basic CRUD operations
  getAll: (params?: ListParams) => Promise<ApiResponse<T[]>>;
  getById: (id: TId) => Promise<ApiResponse<T | null>>;
  getByIds: (ids: TId[]) => Promise<ApiResponse<T[]>>;
  
  // Search and filtering operations
  search: (field: string, searchTerm: string) => Promise<ApiResponse<T[]>>;
  filterByTagNames: (tagNames: string[]) => Promise<ApiResponse<T[]>>;
  
  // Entity name for reference
  readonly entityName?: string;
}

/**
 * Standard CRUD operations interface for regular entities
 */
export interface ApiOperations<T, TId = string, TCreate = Partial<T>, TUpdate = Partial<T>> 
  extends BaseApiOperations<T, TId, TCreate, TUpdate> {
  // Write operations
  create: (data: TCreate) => Promise<ApiResponse<T>>;
  update: (id: TId, data: TUpdate) => Promise<ApiResponse<T>>;
  delete: (id: TId) => Promise<ApiResponse<boolean>>;
  
  // Batch operations (optional)
  batchCreate?: (data: TCreate[]) => Promise<ApiResponse<T[]>>;
  batchUpdate?: (items: {id: TId, data: TUpdate}[]) => Promise<ApiResponse<T[]>>;
  batchDelete?: (ids: TId[]) => Promise<ApiResponse<boolean>>;
  
  // Table name for reference
  readonly tableName?: string;
}

/**
 * View operations interface (read-only)
 */
export interface ViewApiOperations<T, TId = string> extends BaseApiOperations<T, TId> {
  // Enhanced operations that include tags by default
  getAllWithTags?: (params?: ListParams) => Promise<ApiResponse<T[]>>;
  getByIdWithTags?: (id: TId) => Promise<ApiResponse<T | null>>;
  getByTagId?: (tagId: string, params?: ListParams) => Promise<ApiResponse<T[]>>;
  
  // View name for reference
  readonly viewName?: string;
}

/**
 * Enhanced API operations that include tag support
 */
export interface EnhancedApiOperations<T, TId = string, TCreate = Partial<T>, TUpdate = Partial<T>> 
  extends ApiOperations<T, TId, TCreate, TUpdate> {
  // Enhanced operations that include tags by default
  getAllWithTags: (params?: ListParams) => Promise<ApiResponse<T[]>>;
  getByIdWithTags: (id: TId) => Promise<ApiResponse<T | null>>;
  getByTagId: (tagId: string, params?: ListParams) => Promise<ApiResponse<T[]>>;
}

/**
 * Relationship-specific operations interface that extends standard API operations
 * but omits the generic 'create' method to prevent misuse. Relationship entities
 * should use specific creation methods that enforce proper relationship semantics.
 */
export interface RelationshipApiOperations<T, TId = string, TCreate = Partial<T>, TUpdate = Partial<T>> 
  extends Omit<ApiOperations<T, TId, TCreate, TUpdate>, 'create'> {
  // All RUD operations are inherited (Read, Update, Delete)
  // The generic 'create' method is intentionally omitted
  // Relationship-specific creation methods should be added by extending interfaces
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
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like' | 'ilike' | 'contains';

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
