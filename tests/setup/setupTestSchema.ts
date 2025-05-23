
import { supabase } from '@/integrations/supabase/client';

/**
 * Sets up the testing schema by calling the test-setup function
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
 * Cleans all test data
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
