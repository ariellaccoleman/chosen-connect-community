
import { BaseRepository } from './BaseRepository';
import { createSupabaseRepository } from './SupabaseRepository';
import { createMockRepository } from './MockRepository';
import { supabase } from '@/integrations/supabase/client';

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
  console.log(`Creating repository for table: ${tableName}, schema: ${schema}`);
  
  // Verify Supabase client is available
  if (!supabase) {
    throw new Error(`Supabase client is not available for table ${tableName}`);
  }
  
  console.log('Supabase client verification:', {
    hasClient: !!supabase,
    hasFrom: !!(supabase && supabase.from),
    clientType: typeof supabase
  });
  
  return createSupabaseRepository<T>(tableName, supabase, schema);
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
  const schema = options.schema || 'testing';
  console.log(`Creating testing repository for table: ${tableName}, schema: ${schema}`);
  
  // Verify Supabase client is available
  if (!supabase) {
    throw new Error(`Supabase client is not available for testing table ${tableName}`);
  }
  
  console.log('Testing repository Supabase client verification:', {
    hasClient: !!supabase,
    hasFrom: !!(supabase && supabase.from),
    clientType: typeof supabase,
    environment: typeof window === 'undefined' ? 'Node.js' : 'Browser'
  });
  
  // Always use a real Supabase repository with the specified schema
  // Never use mock repositories, even in test environments
  return createRepository<T>(tableName, { 
    schema: schema,
    enableLogging: options.enableLogging || true
  });
}

/**
 * Export repository types for easier imports
 */
export * from './DataRepository';
export * from './BaseRepository';
export * from './SupabaseRepository';
