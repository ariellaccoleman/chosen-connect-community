
import { BaseRepository } from './BaseRepository';
import { SupabaseRepository } from './SupabaseRepository';
import { supabase } from '@/integrations/supabase/client';
import { ViewRepository, createViewRepository } from './ViewRepository';

/**
 * Repository options interface
 */
export interface RepositoryOptions {
  schema?: string;
  enableLogging?: boolean;
  initialData?: any[];
  client?: any; // Add client parameter
}

/**
 * Factory function to create data repositories
 */
export function createRepository<T>(
  tableName: string,
  options: RepositoryOptions = {},
  providedClient?: any // Add client parameter
): BaseRepository<T> {
  const schema = options.schema || 'public';
  const clientToUse = providedClient || options.client || supabase;
  
  // Verify client is available
  if (!clientToUse) {
    throw new Error(`Supabase client is not available for table ${tableName}`);
  }
  
  return new SupabaseRepository<T>(tableName, clientToUse, schema);
}

/**
 * Create a repository for testing with the specified schema
 */
export function createTestingRepository<T>(
  tableName: string,
  options: { 
    schema?: string;
    initialData?: any[];
    enableLogging?: boolean;
    client?: any; // Add client parameter
  } = {},
  providedClient?: any // Add client parameter
): BaseRepository<T> {
  const schema = options.schema || 'testing';
  const clientToUse = providedClient || options.client || supabase;
  
  // Verify client is available
  if (!clientToUse) {
    throw new Error(`Supabase client is not available for testing table ${tableName}`);
  }
  
  // Always use a real Supabase repository with the specified schema
  // Never use mock repositories, even in test environments
  return createRepository<T>(tableName, { 
    schema: schema,
    enableLogging: options.enableLogging || true,
    client: clientToUse
  });
}

/**
 * Create a view repository for read-only operations
 */
export function createViewRepositoryInstance<T>(
  viewName: string,
  options: { 
    schema?: string;
    enableLogging?: boolean;
    client?: any; // Add client parameter
  } = {},
  providedClient?: any // Add client parameter
): ViewRepository<T> {
  const schema = options.schema || 'public';
  const clientToUse = providedClient || options.client || supabase;
  
  // Verify client is available
  if (!clientToUse) {
    throw new Error(`Supabase client is not available for view ${viewName}`);
  }
  
  const viewRepo = createViewRepository<T>(viewName, clientToUse, schema);
  
  if (options.enableLogging) {
    viewRepo.setOptions({ enableLogging: true });
  }
  
  return viewRepo;
}

/**
 * Create a view repository for testing with the specified schema
 */
export function createTestingViewRepository<T>(
  viewName: string,
  options: { 
    schema?: string;
    enableLogging?: boolean;
    client?: any; // Add client parameter
  } = {},
  providedClient?: any // Add client parameter
): ViewRepository<T> {
  const schema = options.schema || 'testing';
  const clientToUse = providedClient || options.client || supabase;
  
  // Verify client is available
  if (!clientToUse) {
    throw new Error(`Supabase client is not available for testing view ${viewName}`);
  }
  
  // Always use a real Supabase view repository with the specified schema
  return createViewRepositoryInstance<T>(viewName, { 
    schema: schema,
    enableLogging: options.enableLogging || true,
    client: clientToUse
  }, clientToUse);
}

// Export repository types for easier imports
export * from './DataRepository';
export * from './BaseRepository';
export * from './SupabaseRepository';

// Export new view repository types and functions
export * from './ReadOnlyRepository';
export * from './ViewRepository';
