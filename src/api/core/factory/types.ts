
import { Database } from "@/integrations/supabase/types";
import { ApiOperations } from "../types";
import { DataRepository } from "../repository/repositoryFactory";

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
  }) => Promise<{
    data: T[];
    error: any;
    status: 'success' | 'error';
  }>;
  
  getById: (id: TId) => Promise<{
    data: T | null;
    error: any;
    status: 'success' | 'error';
  }>;
  
  getByIds: (ids: TId[]) => Promise<{
    data: T[];
    error: any;
    status: 'success' | 'error';
  }>;
  
  // View name for reference
  readonly viewName: string;
}
