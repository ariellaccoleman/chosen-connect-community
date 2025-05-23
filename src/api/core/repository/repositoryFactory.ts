
import { BaseRepository } from './BaseRepository';
import { createSupabaseRepository } from './SupabaseRepository';

/**
 * Repository options interface
 */
export interface RepositoryOptions {
  schema?: string;
  enableLogging?: boolean;
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
 * Create a repository for testing with the testing schema
 */
export function createTestingRepository<T>(
  tableName: string
): BaseRepository<T> {
  return createRepository<T>(tableName, { schema: 'testing' });
}

/**
 * Export repository types for easier imports
 */
export * from './DataRepository';
export * from './BaseRepository';
export * from './SupabaseRepository';
