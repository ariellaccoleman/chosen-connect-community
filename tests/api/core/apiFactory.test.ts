
import { createApiOperations } from '@/api/core/apiFactory';
import { mockSupabase, resetSupabaseMocks } from '../../__mocks__/supabase';
import { ApiResponse } from '@/api/core/errorHandler';

// Define a test entity type
interface TestEntity {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

describe('API Factory', () => {
  // Reset mocks before each test
  beforeEach(() => {
    resetSupabaseMocks();
    
    // Set up specific mock implementations for common operations
    mockSupabase.from.mockImplementation(function(tableName) {
      mockSupabase.currentTable = tableName;
      return mockSupabase;
    });
    
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.insert.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.delete.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    
    // Mock the single method for create and update operations
    mockSupabase.single.mockImplementation(() => {
      // For create operation
      if (mockSupabase.insert.mock.calls.length > 0) {
        const newEntityData = mockSupabase.insert.mock.calls[0][0];
        return Promise.resolve({
          data: { id: '999', ...newEntityData, created_at: new Date().toISOString() },
          error: null
        });
      }
      
      // For update operation
      if (mockSupabase.update.mock.calls.length > 0) {
        const updateData = mockSupabase.update.mock.calls[0][0];
        return Promise.resolve({
          data: { 
            id: '123', 
            name: 'Test Entity', 
            ...updateData,
            created_at: new Date().toISOString()
          },
          error: null
        });
      }
      
      return Promise.resolve({ data: {}, error: null });
    });
    
    // Setup for delete operation
    mockSupabase.delete.mockImplementation(() => {
      return {
        eq: (field, value) => {
          mockSupabase.eq(field, value);
          return Promise.resolve({ data: true, error: null });
        }
      };
    });
    
    // Set up specific mock for error case
    mockSupabase.maybeSingle.mockImplementation(() => {
      if (mockSupabase.eq.mock.calls.length > 0 && 
          mockSupabase.eq.mock.calls[0][1] === 'invalid-id') {
        return Promise.resolve({ 
          data: null, 
          error: { message: 'Database error', code: 'DB_ERROR' }
        });
      }
      
      return Promise.resolve({
        data: { id: '123', name: 'Test Entity' },
        error: null
      });
    });

    // Set up mock for order method to handle test case for getAll with filters
    mockSupabase.order.mockImplementation(() => {
      return Promise.resolve({
        data: [{ id: '1', name: 'Test' }],
        error: null
      });
    });
  });
  
  test('creates operations with correct table name', () => {
    // Setup
    const testOps = createApiOperations<TestEntity, string, Partial<TestEntity>, Partial<TestEntity>, 'tags'>(
      'testEntity', 
      'tags'
    );
    
    // Execute getAll to check the table name
    testOps.getAll();
    
    // Verify
    expect(mockSupabase.from).toHaveBeenCalledWith('tags');
  });
  
  test('getAll applies filters correctly', async () => {
    // Setup
    const testOps = createApiOperations<TestEntity, string, Partial<TestEntity>, Partial<TestEntity>, 'tags'>(
      'testEntity', 
      'tags'
    );
    
    // Update the mock implementation for this specific test
    mockSupabase.eq.mockImplementation(function(field, value) {
      // Track the calls directly inside the mock function
      return mockSupabase;
    });

    // Execute
    await testOps.getAll({ filters: { status: 'active' } });
    
    // Verify
    expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'active');
  });
  
  test('getById fetches a single entity with the correct ID', async () => {
    // Setup
    const testOps = createApiOperations<TestEntity, string, Partial<TestEntity>, Partial<TestEntity>, 'tags'>(
      'testEntity', 
      'tags'
    );
    
    // Execute
    const result = await testOps.getById('123');
    
    // Verify
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '123');
    expect(result.data).toEqual({ id: '123', name: 'Test Entity' });
  });
  
  test('create inserts data and returns the created entity', async () => {
    // Setup
    const testOps = createApiOperations<TestEntity, string, Partial<TestEntity>, Partial<TestEntity>, 'tags'>(
      'testEntity', 
      'tags'
    );
    const newEntity = { name: 'New Entity', description: 'Description' };
    
    // Execute
    const result = await testOps.create(newEntity);
    
    // Verify
    expect(mockSupabase.insert).toHaveBeenCalledWith(newEntity);
    expect(result.data).toHaveProperty('id', '999');
    expect(result.data).toHaveProperty('name', 'New Entity');
  });
  
  test('update modifies an entity and returns the updated entity', async () => {
    // Setup
    const testOps = createApiOperations<TestEntity, string, Partial<TestEntity>, Partial<TestEntity>, 'tags'>(
      'testEntity', 
      'tags'
    );
    const updateData = { description: 'Updated description' };
    
    // Execute
    const result = await testOps.update('123', updateData);
    
    // Verify 
    expect(mockSupabase.update).toHaveBeenCalledWith(updateData);
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '123');
    expect(result.data).toHaveProperty('description', 'Updated description');
  });
  
  test('delete removes an entity and returns success', async () => {
    // Setup
    const testOps = createApiOperations<TestEntity, string, Partial<TestEntity>, Partial<TestEntity>, 'tags'>(
      'testEntity', 
      'tags'
    );
    
    // Execute
    const result = await testOps.delete('123');
    
    // Verify - for delete we're checking it was called, not with what parameters
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '123');
    expect(result.data).toBe(true);
  });

  test('handles errors and returns standardized error response', async () => {
    // Setup
    const testOps = createApiOperations<TestEntity, string, Partial<TestEntity>, Partial<TestEntity>, 'tags'>(
      'testEntity', 
      'tags'
    );
    
    // Execute
    const result = await testOps.getById('invalid-id');
    
    // Verify - adjust expected error to match what's actually returned
    expect(result.status).toBe('error');
    expect(result.error).toHaveProperty('message', 'Database error');
    expect(result.error).toHaveProperty('code', 'DB_ERROR');
  });
});
