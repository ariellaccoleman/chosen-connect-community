
import { Database } from "@/integrations/supabase/types";
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

// Re-export view types
export * from './viewTypes';

// Import and re-export updated API interfaces
export * from '../types';
