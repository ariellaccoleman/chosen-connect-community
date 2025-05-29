import { createApiFactory } from '@/api/core/factory/apiFactory';
import { TestClientFactory } from '@/integrations/supabase/testClient';

// Define a test entity type
interface TestEntity {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

describe.skip('API Factory with Database Repository', () => {
  beforeEach(() => {
    console.log('--- Starting new test ---');
  });

  afterEach(() => {
    TestClientFactory.cleanup();
  });

  test('creates operations with database repository', () => {
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_table'
    });
    
    // Check basic structure
    expect(factory).toHaveProperty('getAll');
    expect(factory).toHaveProperty('getById');
    expect(factory).toHaveProperty('create');
    expect(factory).toHaveProperty('update');
    expect(factory).toHaveProperty('delete');
  });

  test('factory integrates with database correctly', async () => {
    const factory = createApiFactory<TestEntity>({
      tableName: 'profiles', // Use existing table
      defaultSelect: 'id, first_name, last_name, created_at'
    });
    
    // Test that getAll works with real database
    const result = await factory.getAll();
    
    console.log(`Database getAll result: ${JSON.stringify({ status: result.status, hasData: !!result.data })}`);
    
    // Should work with database (might return empty results, but no error)
    expect(result.status).toBe('success');
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });

  test('supports extended operations with database', async () => {
    const factory = createApiFactory<TestEntity>({
      tableName: 'profiles',
      useQueryOperations: true,
      useMutationOperations: true,
      useBatchOperations: true
    });
    
    // Check that extended operations are present
    expect(factory).toHaveProperty('getAll'); // Base operation
    expect(factory).toHaveProperty('getById'); // Base operation
    expect(factory).toHaveProperty('getByIds'); // Query operation
    expect(factory).toHaveProperty('batchCreate'); // Batch operation
    expect(factory).toHaveProperty('tableName'); // Additional property
  });

  test('handles database errors gracefully', async () => {
    const factory = createApiFactory<TestEntity>({
      tableName: 'nonexistent_table'
    });
    
    // Call method that should handle the error
    const result = await factory.getAll();
    
    // Verify error was handled gracefully
    expect(result.status).toBe('error');
    expect(result.error).toBeDefined();
  });

  test('database repository handles invalid UUID format gracefully', async () => {
    const factory = createApiFactory<TestEntity>({
      tableName: 'profiles'
    });
    
    // Try to get a record with invalid UUID format
    const result = await factory.getById('invalid-uuid-format');
    
    console.log(`Database getById with invalid UUID result: ${JSON.stringify({ status: result.status, hasData: !!result.data })}`);
    
    // Should handle invalid UUID gracefully and return error status
    expect(result.status).toBe('error');
    expect(result.error).toBeDefined();
    expect(result.data).toBeNull();
  });

  test('database repository respects RLS policies', async () => {
    const factory = createApiFactory<TestEntity>({
      tableName: 'profiles'
    });
    
    // Try to get a specific record by valid UUID format
    const result = await factory.getById('00000000-0000-0000-0000-000000000000');
    
    console.log(`Database getById result: ${JSON.stringify({ status: result.status, hasData: !!result.data })}`);
    
    // Should handle not found gracefully
    expect(result.status).toBe('success');
    expect(result.data).toBeNull();
  });
});
