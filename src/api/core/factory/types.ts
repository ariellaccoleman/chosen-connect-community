
import type { Database } from '@/integrations/supabase/types';

// Extract table names from Database type
export type TableNames = keyof Database['public']['Tables'];

// View names (including the new posts_with_tags view)
export type ViewNames = 
  | 'people_with_tags'
  | 'organizations_with_tags' 
  | 'events_with_tags'
  | 'posts_with_tags'
  | 'all_tags_with_entity_types_view'
  | 'entity_tag_assignments_view'
  | 'filtered_entity_tags_view'
  | 'hub_details'
  | 'orphaned_tags_view'
  | 'tag_entity_types_view'
  | 'chat_reply_counts';

/**
 * Base configuration for API factories
 */
export interface ApiFactoryConfig<T> {
  tableName: TableNames;
  entityName: string;
  defaultOrderBy?: string;
  transformResponse?: (data: any) => T;
  transformRequest?: (data: any) => any;
  withTagsView?: ViewNames | string; // Allow view names for enhanced tag operations
}

/**
 * Extended configuration including operation flags
 */
export interface ApiFactoryOptions<T, TCreate = Partial<T>, TUpdate = Partial<T>> 
  extends ApiFactoryConfig<T> {
  useMutationOperations?: boolean;
  useBatchOperations?: boolean;
  useRelationshipOperations?: boolean;
  client?: any; // Optional Supabase client override
}

/**
 * Standard CRUD operations interface
 */
export interface ApiOperations<T, TId = string, TCreate = Partial<T>, TUpdate = Partial<T>> {
  // Read operations
  getAll: (options?: {
    filters?: Record<string, any>;
    search?: string;
    searchColumns?: string[];
    orderBy?: string;
    ascending?: boolean;
    limit?: number;
    offset?: number;
    select?: string;
    includeTags?: boolean;
    tagId?: string;
  }) => Promise<any>;
  getById: (id: TId, select?: string) => Promise<any>;
  getByIds: (ids: TId[], select?: string) => Promise<any>;
  
  // Enhanced read operations (if withTagsView is provided)
  getAllWithTags?: (options?: {
    filters?: Record<string, any>;
    search?: string;
    searchColumns?: string[];
    orderBy?: string;
    ascending?: boolean;
    limit?: number;
    offset?: number;
  }) => Promise<any>;
  getByTagId?: (tagId: string, options?: {
    search?: string;
    searchColumns?: string[];
    orderBy?: string;
    ascending?: boolean;
    limit?: number;
    offset?: number;
  }) => Promise<any>;
  getByIdWithTags?: (id: TId) => Promise<any>;
  
  // Write operations
  create?: (data: TCreate) => Promise<any>;
  update?: (id: TId, data: TUpdate) => Promise<any>;
  delete?: (id: TId) => Promise<any>;
  
  // Batch operations (optional)
  batchCreate?: (data: TCreate[]) => Promise<any>;
  batchUpdate?: (updates: Array<{ id: TId; data: TUpdate }>) => Promise<any>;
  batchDelete?: (ids: TId[]) => Promise<any>;
}

/**
 * List parameters for read operations
 */
export interface ListParams {
  filters?: Record<string, any>;
  search?: string;
  searchColumns?: string[];
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  offset?: number;
  select?: string;
  includeTags?: boolean;
  tagId?: string;
}

/**
 * Standard response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  error?: any;
}
