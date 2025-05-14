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
  });
  
  test('creates operations with correct table name', () => {
    // Setup
    const testOps = createApiOperations<TestEntity, string, Partial<TestEntity>, Partial<TestEntity>, 'tags'>(
      'testEntity', 
      'tags'
    );
    mockSupabase.from.mockImplementation((tableName) => {
      mockSupabase.currentTable = tableName;
      return mockSupabase;
    });
    
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
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.order.mockResolvedValue({ data: [{ id: '1', name: 'Test' }], error: null });
    
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
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.maybeSingle.mockResolvedValue({ 
      data: { id: '123', name: 'Test Entity' }, 
      error: null 
    });
    
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
    
    mockSupabase.from.mockReturnThis();
    mockSupabase.insert.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.single.mockResolvedValue({
      data: { id: '999', ...newEntity, created_at: new Date().toISOString() },
      error: null
    });
    
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
    
    mockSupabase.from.mockReturnThis();
    mockSupabase.update.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.single.mockResolvedValue({
      data: { 
        id: '123', 
        name: 'Test Entity', 
        description: 'Updated description',
        created_at: new Date().toISOString()
      },
      error: null
    });
    
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
    
    mockSupabase.from.mockReturnThis();
    mockSupabase.delete.mockReturnThis();
    mockSupabase.eq.mockResolvedValue({ error: null });
    
    // Execute
    const result = await testOps.delete('123');
    
    // Verify
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
    const testError = { message: 'Database error', code: 'DB_ERROR' };
    
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockResolvedValue({ data: null, error: testError });
    
    // Execute
    const result = await testOps.getById('invalid-id');
    
    // Verify
    expect(result.status).toBe('error');
    expect(result.error).toHaveProperty('message', 'Database error');
    expect(result.error).toHaveProperty('code', 'DB_ERROR');
  });
});
