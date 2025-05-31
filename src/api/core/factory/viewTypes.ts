
import { Database } from "@/integrations/supabase/types";

// Define a type for valid view names from the Database type
export type ViewNames = keyof Database['public']['Views'];

// Get the Row type for a specific view
export type ViewRow<T extends ViewNames> = Database['public']['Views'][T]['Row'];

// Define a type for valid column names for a specific view
export type ViewColumnName<T extends ViewNames> = keyof Database['public']['Views'][T]['Row'] & string;

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
    isSuccess: () => boolean;
    isError: () => boolean;
  }>;
  
  getById: (id: TId) => Promise<{
    data: T | null;
    error: any;
    status: 'success' | 'error';
    isSuccess: () => boolean;
    isError: () => boolean;
  }>;
  
  getByIds: (ids: TId[]) => Promise<{
    data: T[];
    error: any;
    status: 'success' | 'error';
    isSuccess: () => boolean;
    isError: () => boolean;
  }>;
  
  // Search and filtering operations
  search: (field: string, searchTerm: string) => Promise<{
    data: T[];
    error: any;
    status: 'success' | 'error';
    isSuccess: () => boolean;
    isError: () => boolean;
  }>;
  
  filterByTagNames: (tagNames: string[]) => Promise<{
    data: T[];
    error: any;
    status: 'success' | 'error';
    isSuccess: () => boolean;
    isError: () => boolean;
  }>;
  
  // View name for reference
  readonly viewName: string;
}
