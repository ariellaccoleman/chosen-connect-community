
import { createSchemaAwareRepository } from '../repository/schemaAwareRepositoryFactory';
import { supabase } from '@/integrations/supabase/client';
import { createMockRepository } from '../repository/MockRepository';

/**
 * Creates a test repository that uses the testing schema in Supabase.
 * Falls back to mock repository if not running in an environment with Supabase access.
 */
export async function createTestRepository<T>(
  tableName: string,
  initialData: T[] = []
) {
  // Setup testing schema if in connected environment
  try {
    // Only try to setup schema if we're not running in browser
    if (typeof window === 'undefined') {
      await setupTestingSchema();
    }
    
    // Create a repository that uses the testing schema
    return createSchemaAwareRepository<T>(tableName, 'supabase', initialData);
  } catch (error) {
    console.warn('Error setting up test schema, falling back to mock repository', error);
    // Fall back to mock repository for environments without Supabase access
    return createMockRepository<T>(tableName, initialData);
  }
}

/**
 * Setup the testing schema by calling the test-setup edge function
 */
export async function setupTestingSchema(): Promise<void> {
  console.log('Setting up testing schema...');
  try {
    const { data, error } = await supabase.functions.invoke('test-setup', {
      body: { action: 'setup_schema' }
    });
    
    if (error) {
      console.error('Failed to set up testing schema:', error);
      throw error;
    }
    
    console.log('Testing schema setup complete:', data.message);
  } catch (err) {
    console.error('Error setting up testing schema:', err);
    throw err;
  }
}

/**
 * Create a test table in the testing schema
 */
export async function createTestTable(
  tableName: string,
  columns?: Array<{ 
    name: string; 
    type: string; 
    isPrimary?: boolean; 
    isRequired?: boolean;
    defaultValue?: string;
  }>
): Promise<void> {
  console.log(`Creating test table: ${tableName}`);
  try {
    const { error } = await supabase.functions.invoke('test-setup', {
      body: { 
        action: 'create_test_table',
        tableName,
        columns
      }
    });
    
    if (error) {
      console.error(`Failed to create test table ${tableName}:`, error);
      throw error;
    }
    
    console.log(`Test table ${tableName} created successfully`);
  } catch (err) {
    console.error(`Error creating test table ${tableName}:`, err);
    throw err;
  }
}

/**
 * Clean test data by calling the test-setup edge function
 */
export async function cleanTestData(): Promise<void> {
  console.log('Cleaning test data...');
  try {
    const { data, error } = await supabase.functions.invoke('test-setup', {
      body: { action: 'clean_test_data' }
    });
    
    if (error) {
      console.error('Failed to clean test data:', error);
      throw error;
    }
    
    console.log('Test data cleaned:', data.message);
  } catch (err) {
    console.error('Error cleaning test data:', err);
    throw err;
  }
}
