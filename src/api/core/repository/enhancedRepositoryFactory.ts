
import { supabase } from "@/integrations/supabase/client";
import { BaseRepository } from "./BaseRepository";
import { SupabaseRepository } from "./SupabaseRepository";
import { EntityRepository } from "./EntityRepository";
import { Entity } from "@/types/entity";
import { EntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";

export type EnhancedRepositoryType = "supabase";

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
  
  /**
   * Database schema to use (defaults to 'public')
   */
  schema?: string;
}

/**
 * Creates an enhanced repository for accessing a table with additional functionality
 * 
 * @param tableName Name of the table
 * @param type Repository type (only supabase supported)
 * @param options Repository configuration options
 * @returns A BaseRepository instance
 */
export function createEnhancedRepository<T>(
  tableName: string,
  type: EnhancedRepositoryType = "supabase",
  initialData?: T[],
  options: EnhancedRepositoryOptions<T> = {},
  providedClient?: any
): BaseRepository<T> {
  const schema = options.schema || 'public';
  const clientToUse = providedClient || supabase;
  
  // Create base repository using the SupabaseRepository constructor directly
  const repository = new SupabaseRepository<T>(tableName, clientToUse, schema);
  
  // Log repository creation in development
  if (process.env.NODE_ENV === "development" && options.enableLogging) {
    logger.info(`Creating enhanced repository for table ${tableName}`, {
      repositoryType: type,
      schema,
      options
    });
  }
  
  // Apply options to repository if supported
  if ("setOptions" in repository && typeof repository.setOptions === "function") {
    repository.setOptions({
      idField: options.idField || "id",
      defaultSelect: options.defaultSelect,
      softDelete: options.softDelete || false,
      deletedAtColumn: options.deletedAtColumn || "deleted_at",
      schema
    });
  }
  
  return repository;
}

/**
 * Abstract factory class for creating entity repositories
 * To be extended by specific entity repository factories
 */
export abstract class EntityRepositoryFactory<T extends Entity> {
  /**
   * Create an entity repository
   * @param type Repository type (only supabase supported)
   * @param initialData Initial data (ignored for schema-based repositories)
   * @returns EntityRepository instance
   */
  abstract createRepository(
    type: EnhancedRepositoryType,
    initialData?: T[]
  ): EntityRepository<T>;
  
  /**
   * Get the table name for this entity type
   */
  abstract getTableName(): string;
  
  /**
   * Get the entity type this factory creates repositories for
   */
  abstract getEntityType(): EntityType;
  
  /**
   * Create a production Supabase repository
   * @returns EntityRepository instance
   */
  createSupabaseRepository(): EntityRepository<T> {
    return this.createRepository('supabase');
  }
}
