
import { BaseRepository } from './BaseRepository';
import { createSupabaseRepository } from './SupabaseRepository';
import { createMockRepository } from './MockRepository';

/**
 * Repository options interface
 */
export interface RepositoryOptions {
  schema?: string;
  enableLogging?: boolean;
  initialData?: any[];
}

/**
 * Factory function to create data repositories
 */
export function createRepository<T>(
  tableName: string,
  options: RepositoryOptions = {}
): BaseRepository<T> {
  const schema = options.schema || 'public';
  return createSupabaseRepository<T>(tableName, undefined, schema);
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
  } = {}
): BaseRepository<T> {
  // Always use a real Supabase repository with the specified schema
  // Never use mock repositories, even in test environments
  return createRepository<T>(tableName, { 
    schema: options.schema || 'testing',
    enableLogging: options.enableLogging
  });
}

/**
 * Export repository types for easier imports
 */
export * from './DataRepository';
export * from './BaseRepository';
export * from './SupabaseRepository';
