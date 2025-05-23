
import { supabase } from '@/integrations/supabase/client';
import { createTestingRepository } from '../repository/repositoryFactory';
import { BaseRepository } from '../repository/BaseRepository';

/**
 * Set up the testing schema by cloning the structure from public schema
 */
export async function setupTestSchema(): Promise<void> {
  try {
    await supabase.rpc('setup_testing_schema');
    console.log('Testing schema setup complete');
  } catch (error) {
    console.error('Error setting up testing schema:', error);
    throw error;
  }
}

/**
 * Execute raw SQL in the testing schema
 */
export async function executeTestSQL(sql: string): Promise<void> {
  try {
    await supabase.rpc('exec_sql', { query: sql });
  } catch (error) {
    console.error('Error executing SQL in testing schema:', error);
    throw error;
  }
}

/**
 * Clear all data from a table in the testing schema
 */
export async function clearTestTable(tableName: string): Promise<void> {
  try {
    await executeTestSQL(`DELETE FROM ${tableName}`);
    console.log(`Cleared test data from ${tableName}`);
  } catch (error) {
    console.error(`Error clearing test data from ${tableName}:`, error);
    throw error;
  }
}

/**
 * Seed test data into a table in the testing schema
 */
export async function seedTestData<T>(
  tableName: string, 
  data: T[]
): Promise<void> {
  if (!data || data.length === 0) {
    return;
  }
  
  try {
    const repository = createTestingRepository<T>(tableName);
    await repository.insert(data as any).execute();
    console.log(`Seeded ${data.length} records into ${tableName}`);
  } catch (error) {
    console.error(`Error seeding test data into ${tableName}:`, error);
    throw error;
  }
}

/**
 * Create a test context that provides repositories and utilities for testing
 */
export function createTestContext<T>(tableName: string) {
  const repository = createTestingRepository<T>(tableName);
  
  const setup = async (initialData?: T[]): Promise<void> => {
    // Clear existing data first
    await clearTestTable(tableName);
    
    // Seed initial data if provided
    if (initialData && initialData.length > 0) {
      await seedTestData(tableName, initialData);
    }
  };
  
  const cleanup = async (): Promise<void> => {
    await clearTestTable(tableName);
  };
  
  return {
    repository,
    setup,
    cleanup,
  };
}

/**
 * Create a Jest beforeAll hook that sets up the testing schema
 */
export function setupTestingEnvironment() {
  return async (): Promise<void> => {
    await setupTestSchema();
  };
}

/**
 * Create a Jest afterAll hook that cleans up the testing schema
 */
export function teardownTestingEnvironment(tableNames: string[]) {
  return async (): Promise<void> => {
    for (const tableName of tableNames) {
      await clearTestTable(tableName);
    }
  };
}
