
import { SchemaAwareRepository } from './SchemaAwareRepository';
import { BaseRepository } from './BaseRepository';
import { createRepository } from './repositoryFactory';
import { getCurrentSchema } from './schemaAwareClientFactory';

/**
 * Create a schema-aware repository
 */
export function createSchemaAwareRepository<T>(
  tableName: string,
  type: 'mock' | 'supabase' = 'supabase',
  initialData: T[] = []
): SchemaAwareRepository<T> {
  // Create base repository
  // Pass only the required arguments to createRepository (it expects 1-3 arguments)
  const baseRepo = createRepository<T>(tableName, type, initialData);
  
  // Get current schema from environment
  const schema = getCurrentSchema();
  
  // Wrap with schema awareness
  return new SchemaAwareRepository<T>(baseRepo as BaseRepository<T>, schema);
}
