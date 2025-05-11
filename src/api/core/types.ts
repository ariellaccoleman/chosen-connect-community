
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
