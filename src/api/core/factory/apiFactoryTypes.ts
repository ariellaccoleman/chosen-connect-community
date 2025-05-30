
import { DataRepository, ViewRepository } from "../repository";
import { TableNames, ViewNames } from "./types";

/**
 * Repository configuration
 */
export interface RepositoryConfig<T = any> {
  /**
   * Repository type (supabase, mock)
   */
  type: EnhancedRepositoryType;
  
  /**
   * Initial data for mock repository
   */
  initialData?: T[];
  
  /**
   * Enable enhanced repository features
   */
  enhanced?: boolean;
  
  /**
   * Enable logging for repository operations (development only)
   */
  enableLogging?: boolean;
}

/**
 * Enhanced API Factory options with repository support
 */
export interface ApiFactoryConfig<T> extends Omit<ApiFactoryOptions<T>, 'repository'> {
  /**
   * Enable mutation operations
   */
  useMutationOperations?: boolean;
  
  /**
   * Enable batch operations
   */
  useBatchOperations?: boolean;
  
  /**
   * Repository instance, factory function or configuration
   */
  repository?: DataRepository<T> | (() => DataRepository<T>) | RepositoryConfig<T>;
}

/**
 * Enhanced repository type enumeration
 */
export type EnhancedRepositoryType = 'supabase' | 'mock';

// Re-export commonly used types from the main types file
export type { 
  ApiFactoryOptions, 
  TableNames, 
  ViewNames, 
  ViewFactoryOptions, 
  ViewOperations, 
  RelationshipFactoryOptions,
  ApiOperations,
  RelationshipApiOperations
} from "./types";
