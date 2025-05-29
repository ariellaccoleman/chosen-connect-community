
import { BaseRepository } from './BaseRepository';
import { createSupabaseRepository } from './SupabaseRepository';
import { createMockRepository } from './MockRepository';
import { ViewRepository, createViewRepository } from './ViewRepository';

/**
 * Repository options interface
 */
export interface RepositoryOptions {
  schema?: string;
  enableLogging?: boolean;
  initialData?: any[];
}

/**
 * Factory function to create data repositories with mandatory client
 */
export function createRepository<T>(
  tableName: string,
  client: any, // Mandatory client parameter
  options: RepositoryOptions = {}
): BaseRepository<T> {
  const schema = options.schema || 'public';
  console.log(`Creating repository for table: ${tableName}, schema: ${schema}`);
  
  // Verify client is provided
  if (!client) {
    throw new Error(`Client is required for table ${tableName}`);
  }
  
  console.log('Client verification:', {
    hasClient: !!client,
    hasFrom: !!(client && client.from),
    clientType: typeof client
  });
  
  return createSupabaseRepository<T>(tableName, client, schema);
}

/**
 * Create a repository for testing with the specified schema
 */
export function createTestingRepository<T>(
  tableName: string,
  client: any, // Mandatory client parameter
  options: { 
    schema?: string;
    initialData?: any[];
    enableLogging?: boolean;
  } = {}
): BaseRepository<T> {
  const schema = options.schema || 'testing';
  console.log(`Creating testing repository for table: ${tableName}, schema: ${schema}`);
  
  // Verify client is provided
  if (!client) {
    throw new Error(`Client is required for testing table ${tableName}`);
  }
  
  console.log('Testing repository client verification:', {
    hasClient: !!client,
    hasFrom: !!(client && client.from),
    clientType: typeof client,
    environment: typeof window === 'undefined' ? 'Node.js' : 'Browser'
  });
  
  // Always use a real Supabase repository with the specified schema
  return createRepository<T>(tableName, client, { 
    schema: schema,
    enableLogging: options.enableLogging || true
  });
}

/**
 * Create a view repository for read-only operations
 */
export function createViewRepositoryInstance<T>(
  viewName: string,
  client: any, // Mandatory client parameter
  options: { 
    schema?: string;
    enableLogging?: boolean;
  } = {}
): ViewRepository<T> {
  const schema = options.schema || 'public';
  console.log(`Creating view repository for view: ${viewName}, schema: ${schema}`);
  
  // Verify client is provided
  if (!client) {
    throw new Error(`Client is required for view ${viewName}`);
  }
  
  console.log('View repository client verification:', {
    hasClient: !!client,
    hasFrom: !!(client && client.from),
    clientType: typeof client
  });
  
  const viewRepo = createViewRepository<T>(viewName, client, schema);
  
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
  client: any, // Mandatory client parameter
  options: { 
    schema?: string;
    enableLogging?: boolean;
  } = {}
): ViewRepository<T> {
  const schema = options.schema || 'testing';
  console.log(`Creating testing view repository for view: ${viewName}, schema: ${schema}`);
  
  // Verify client is provided
  if (!client) {
    throw new Error(`Client is required for testing view ${viewName}`);
  }
  
  console.log('Testing view repository client verification:', {
    hasClient: !!client,
    hasFrom: !!(client && client.from),
    clientType: typeof client,
    environment: typeof window === 'undefined' ? 'Node.js' : 'Browser'
  });
  
  // Always use a real Supabase view repository with the specified schema
  return createViewRepositoryInstance<T>(viewName, client, { 
    schema: schema,
    enableLogging: options.enableLogging || true
  });
}

// Export repository types for easier imports
export * from './DataRepository';
export * from './BaseRepository';
export * from './SupabaseRepository';

// Export new view repository types and functions
export * from './ReadOnlyRepository';
export * from './ViewRepository';
