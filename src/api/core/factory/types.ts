
import { Database } from "@/integrations/supabase/types";
import { ApiOperations } from "../types";
import { DataRepository } from "../repository/repositoryFactory";

// Define a type for valid table names from the Database type
export type TableNames = keyof Database['public']['Tables'];

// Get the Row type for a specific table
export type TableRow<T extends TableNames> = Database['public']['Tables'][T]['Row'];

// Get the Insert type for a specific table
export type TableInsert<T extends TableNames> = Database['public']['Tables'][T]['Insert'];

// Get the Update type for a specific table
export type TableUpdate<T extends TableNames> = Database['public']['Tables'][T]['Update'];

// Define a type for valid column names for a specific table
// Use string type intersection to ensure TS knows this is a string
export type TableColumnName<T extends TableNames> = keyof Database['public']['Tables'][T]['Row'] & string;

// Options type for the API factory function
export interface ApiFactoryOptions<T> {
  idField?: string;
  defaultSelect?: string;
  defaultOrderBy?: string;
  softDelete?: boolean;
  transformResponse?: (item: any) => T;
  transformRequest?: (item: any) => Record<string, any>;
  repository?: DataRepository<T> | (() => DataRepository<T>);
}
