
import { Database } from "@/integrations/supabase/types";
import { DataRepository } from "../repository/repositoryFactory";
import { ApiResponse } from "../types";

// Define a type for valid table names from the Database type
export type TableNames = keyof Database['public']['Tables'];

// Define a type for valid view names from the Database type
export type ViewNames = keyof Database['public']['Views'];

// Get the Row type for a specific table
export type TableRow<T extends TableNames> = Database['public']['Tables'][T]['Row'];

// Get the Row type for a specific view
export type ViewRow<T extends ViewNames> = Database['public']['Views'][T]['Row'];

// Get the Insert type for a specific table
export type TableInsert<T extends TableNames> = Database['public']['Tables'][T]['Insert'];

// Get the Update type for a specific table
export type TableUpdate<T extends TableNames> = Database['public']['Tables'][T]['Update'];

// Define a type for valid column names for a specific table
// Use string type intersection to ensure TS knows this is a string
export type TableColumnName<T extends TableNames> = keyof Database['public']['Tables'][T]['Row'] & string;

// Define a type for valid column names for a specific view
export type ViewColumnName<T extends ViewNames> = keyof Database['public']['Views'][T]['Row'] & string;

// Options type for the API factory function
export interface ApiFactoryOptions<T> {
  idField?: string;
  defaultSelect?: string;
  defaultOrderBy?: string;
  softDelete?: boolean;
  transformResponse?: (item: any) => T;
  transformRequest?: (item: any) => Record<string, any>;
}

/**
 * Options type for relationship API factory functions
 * Extends ApiFactoryOptions with relationship-specific configuration
 */
export interface RelationshipFactoryOptions<T> extends ApiFactoryOptions<T> {
  // Relationship-specific validation functions
  validateRelationship?: (sourceId: string, targetId: string, relationshipType?: string) => boolean;
  
  // Custom relationship creation logic
  onRelationshipCreated?: (relationship: T) => void | Promise<void>;
  onRelationshipDeleted?: (relationshipId: string) => void | Promise<void>;
  
  // Cascade options for relationship operations
  cascadeDelete?: boolean;
  preventDuplicates?: boolean;
  
  // Relationship metadata
  sourceEntityType?: string;
  targetEntityType?: string;
  relationshipDescription?: string;
}

// Options type for the View factory function (read-only operations)
export interface ViewFactoryOptions<T> {
  idField?: string;
  defaultSelect?: string;
  defaultOrderBy?: string;
  transformResponse?: (item: any) => T;
  enableLogging?: boolean;
}

// Read-only operations interface for view factories
export interface ViewOperations<T, TId = string> {
  // Read operations only
  getAll: (params?: {
    filters?: Record<string, any>;
    search?: string;
    searchColumns?: string[];
    ascending?: boolean;
    limit?: number;
    offset?: number;
    select?: string;
  }) => Promise<ApiResponse<T[]>>;
  
  getById: (id: TId) => Promise<ApiResponse<T | null>>;
  
  getByIds: (ids: TId[]) => Promise<ApiResponse<T[]>>;
  
  // View name for reference
  readonly viewName: string;
}

// Full API operations interface (includes all CRUD operations)
export interface ApiOperations<T, TId = string, TCreate = Partial<T>, TUpdate = Partial<T>> {
  // Query operations
  getAll: (params?: {
    filters?: Record<string, any>;
    search?: string;
    searchColumns?: string[];
    ascending?: boolean;
    limit?: number;
    offset?: number;
    select?: string;
  }) => Promise<ApiResponse<T[]>>;
  
  getById: (id: TId) => Promise<ApiResponse<T | null>>;
  
  getByIds: (ids: TId[]) => Promise<ApiResponse<T[]>>;
  
  // Mutation operations
  create: (data: TCreate) => Promise<ApiResponse<T>>;
  
  update: (id: TId, data: TUpdate) => Promise<ApiResponse<T>>;
  
  delete: (id: TId) => Promise<ApiResponse<T | null>>;
  
  // Table name for reference
  readonly tableName: string;
}

// Relationship API operations (excludes generic create, includes read/update/delete)
export interface RelationshipApiOperations<T, TId = string, TCreate = Partial<T>, TUpdate = Partial<T>> extends Omit<ApiOperations<T, TId, TCreate, TUpdate>, 'create'> {
  // All operations except generic create
  // Relationship-specific create methods would be added by extending classes
}
