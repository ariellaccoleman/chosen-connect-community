
import { DataRepository } from './DataRepository';
import { createSupabaseRepository } from './SupabaseRepository';
import { createMockRepository, MockRepository } from './MockRepository';

/**
 * Repository type to differentiate between real and mock implementations
 */
export type RepositoryType = 'supabase' | 'mock';

/**
 * Factory function to create data repositories
 */
export function createRepository<T>(
  tableName: string, 
  type: RepositoryType = 'supabase',
  initialData: T[] = []
): DataRepository<T> {
  switch (type) {
    case 'mock':
      return createMockRepository<T>(tableName, initialData);
    case 'supabase':
    default:
      return createSupabaseRepository<T>(tableName);
  }
}

/**
 * Export repository types for easier imports
 */
export * from './DataRepository';
export * from './SupabaseRepository';
export * from './MockRepository';
