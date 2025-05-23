
import { BaseRepository } from './BaseRepository';
import { createRepository, RepositoryType } from './repositoryFactory';

/**
 * Creates a repository that uses the specified schema for all operations.
 * This is a compatibility wrapper for existing code that uses this function.
 * 
 * @param tableName - The name of the table
 * @param type - The type of repository (supabase or mock)
 * @param initialData - Optional initial data for mock repositories
 * @param schema - The schema to use (defaults to 'public')
 * @returns A repository instance configured to use the specified schema
 */
export function createSchemaAwareRepository<T>(
  tableName: string,
  type: RepositoryType = 'supabase',
  initialData: T[] = [],
  schema: string = 'public'
): BaseRepository<T> {
  // Simply use the createRepository function with schema parameter
  return createRepository<T>(tableName, type, initialData, schema);
}
