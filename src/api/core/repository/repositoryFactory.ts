
import { BaseRepository } from './BaseRepository';
import { SupabaseRepository, createSupabaseRepository } from './SupabaseRepository';
import { MockRepository, createMockRepository } from './MockRepository';
import { getCurrentSchema } from './schemaAwareClientFactory';

/**
 * Repository type to differentiate between real and mock implementations
 */
export type RepositoryType = 'supabase' | 'mock';

/**
 * Factory function to create data repositories
 * 
 * @param tableName Table name in the database
 * @param type Repository type (supabase or mock)
 * @param initialData Optional initial data for mock repositories
 * @param schema Optional schema name (defaults to getCurrentSchema())
 * @returns A repository instance
 */
export function createRepository<T>(
  tableName: string, 
  type: RepositoryType = 'supabase',
  initialData: T[] = [],
  schema?: string
): BaseRepository<T> {
  // Get current schema if none provided
  const currentSchema = schema || getCurrentSchema();
  
  switch (type) {
    case 'mock':
      return createMockRepository<T>(tableName, initialData);
    case 'supabase':
    default:
      return createSupabaseRepository<T>(tableName, currentSchema);
  }
}

/**
 * Create a repository specifically for testing
 * Uses the 'testing' schema with Supabase or falls back to mock
 * 
 * @param tableName Table name in the database
 * @param type Repository type (supabase or mock)
 * @param initialData Optional initial data for mock repositories
 * @returns A repository instance configured for testing
 */
export function createTestRepository<T>(
  tableName: string,
  type: RepositoryType = 'supabase',
  initialData: T[] = []
): BaseRepository<T> {
  return createRepository<T>(tableName, type, initialData, 'testing');
}

/**
 * Export repository types for easier imports
 */
export * from './DataRepository';
export * from './BaseRepository';
export * from './SupabaseRepository';
export * from './MockRepository';
