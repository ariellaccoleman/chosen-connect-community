
import { BaseRepository } from './BaseRepository';
import { SupabaseRepository, createSupabaseRepository } from './SupabaseRepository';
import { MockRepository, createMockRepository } from './MockRepository';

/**
 * Repository type to differentiate between real and mock implementations
 */
export type RepositoryType = 'supabase' | 'mock';

/**
 * Repository options interface
 */
export interface RepositoryOptions {
  schema?: string;
}

/**
 * Factory function to create data repositories
 */
export function createRepository<T>(
  tableName: string, 
  type: RepositoryType = 'supabase',
  initialData: T[] = [],
  options: RepositoryOptions = {}
): BaseRepository<T> {
  const schema = options.schema || 'public';
  
  switch (type) {
    case 'mock':
      return createMockRepository<T>(tableName, initialData);
    case 'supabase':
    default:
      return createSupabaseRepository<T>(tableName, undefined, schema);
  }
}

/**
 * Create a repository for testing with the testing schema
 */
export function createTestingRepository<T>(
  tableName: string,
  type: RepositoryType = 'supabase',
  initialData: T[] = []
): BaseRepository<T> {
  return createRepository<T>(tableName, type, initialData, { schema: 'testing' });
}

/**
 * Export repository types for easier imports
 */
export * from './DataRepository';
export * from './BaseRepository';
export * from './SupabaseRepository';
export * from './MockRepository';
