
import { supabase } from "@/integrations/supabase/client";
import { DataRepository } from "./DataRepository";
import { SupabaseRepository } from "./SupabaseRepository";
import { MockRepository } from "./MockRepository";
import { logger } from "@/utils/logger";

export type EnhancedRepositoryType = "supabase" | "mock";

export interface EnhancedRepositoryOptions<T> {
  /**
   * The column to use as the primary key
   */
  idField?: string;

  /**
   * The select statement to use for queries
   * Can include joins using Supabase's syntax
   */
  defaultSelect?: string;

  /**
   * Transformer function to modify data before returning it
   */
  transformResponse?: (item: any) => T;

  /**
   * Transformer function to modify data before sending to database
   */
  transformRequest?: (item: any) => Record<string, any>;

  /**
   * Enable soft delete functionality
   */
  softDelete?: boolean;

  /**
   * Column name for soft delete timestamp
   */
  deletedAtColumn?: string;

  /**
   * Enable query logging for debugging
   */
  enableLogging?: boolean;

  /**
   * Cache duration in seconds for read operations
   * Set to 0 to disable caching
   */
  cacheDuration?: number;
}

/**
 * Creates an enhanced repository for accessing a table with additional functionality
 * 
 * @param tableName Name of the table
 * @param type Repository type (supabase or mock)
 * @param options Repository configuration options
 * @returns A DataRepository instance
 */
export function createEnhancedRepository<T>(
  tableName: string,
  type: EnhancedRepositoryType = "supabase",
  initialData?: T[],
  options: EnhancedRepositoryOptions<T> = {}
): DataRepository<T> {
  // Create base repository
  let repository: DataRepository<T>;
  
  // Initialize the repository based on type
  if (type === "mock") {
    repository = new MockRepository<T>(tableName, initialData || []);
  } else {
    repository = new SupabaseRepository<T>(tableName, supabase);
  }
  
  // Log repository creation in development
  if (process.env.NODE_ENV === "development" && options.enableLogging) {
    logger.info(`Creating repository for table ${tableName}`, {
      repositoryType: type,
      options
    });
  }
  
  // Apply options to repository if supported
  if ("setOptions" in repository && typeof repository.setOptions === "function") {
    repository.setOptions({
      idField: options.idField || "id",
      defaultSelect: options.defaultSelect,
      softDelete: options.softDelete || false,
      deletedAtColumn: options.deletedAtColumn || "deleted_at"
    });
  }
  
  return repository;
}
