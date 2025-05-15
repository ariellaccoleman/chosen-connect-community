
import { createBatchOperations } from '@/api/core/factory/operations/batchOperations';
import { mockSupabase, resetSupabaseMocks } from '../../../__mocks__/supabase';

interface TestEntity {
  id: string;
  name: string;
  created_at: string;
}

describe('Batch Operations Factory', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  test('batchCreate calls correct Supabase methods', async () => {
    // Create operations
    const batchOps = createBatchOperations<TestEntity, string, Partial<TestEntity>>(
      'testEntity',
      'test_table'
    );
    
    // Test data
    const newEntities = [
      { name: 'Item 1' },
      { name: 'Item 2' }
    ];
    
    // Setup mock
    mockSupabase.from.mockImplementation(function() { 
      return this;
    });
    
    mockSupabase.insert.mockImplementation(function() {
      return this;
    });
    
    mockSupabase.select.mockImplementation(function() {
      return Promise.resolve({
        data: [
          { id: 'id-1', name: 'Item 1', created_at: new Date().toISOString() },
          { id: 'id-2', name: 'Item 2', created_at: new Date().toISOString() }
        ],
        error: null
      });
    });
    
    // Call batchCreate
    const result = await batchOps.batchCreate(newEntities);
    
    // Check that Supabase was called correctly
    expect(mockSupabase.from).toHaveBeenCalledWith('test_table');
    expect(mockSupabase.insert).toHaveBeenCalledWith(newEntities);
    expect(mockSupabase.select).toHaveBeenCalled();
    
    // Check result format
    expect(result.status).toBe('success');
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(2);
  });
  
  test('batchUpdate calls separate updates for each item', async () => {
    // Create operations
    const batchOps = createBatchOperations<TestEntity, string, Partial<TestEntity>>(
      'testEntity',
      'test_table'
    );
    
    // Setup test data
    const updateData = [
      { id: 'id-1', data: { name: 'Updated Item 1' } },
      { id: 'id-2', data: { name: 'Updated Item 2' } }
    ];
    
    // Setup mock
    mockSupabase.from.mockImplementation(function() { 
      return this;
    });
    
    mockSupabase.update.mockImplementation(function() {
      return this;
    });
    
    mockSupabase.eq.mockImplementation(function() {
      return this;
    });
    
    mockSupabase.select.mockImplementation(function() {
      return this;
    });
    
    mockSupabase.single.mockImplementation(function() {
      const id = mockSupabase.eq.mock.calls[mockSupabase.eq.mock.calls.length - 1][1];
      return Promise.resolve({
        data: { 
          id, 
          name: id === 'id-1' ? 'Updated Item 1' : 'Updated Item 2', 
          created_at: new Date().toISOString() 
        },
        error: null
      });
    });
    
    // Call batchUpdate
    await batchOps.batchUpdate(updateData);
    
    // Check it called update for both items
    expect(mockSupabase.from).toHaveBeenCalledTimes(2);
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'id-1');
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'id-2');
  });
  
  test('batchDelete should perform a single bulk deletion', async () => {
    // Create operations
    const batchOps = createBatchOperations<TestEntity, string>(
      'testEntity',
      'test_table'
    );
    
    // Setup test ids
    const idsToDelete = ['id-1', 'id-2', 'id-3'];
    
    // Setup mock
    mockSupabase.from.mockImplementation(function() { 
      return this;
    });
    
    mockSupabase.delete.mockImplementation(function() {
      return this;
    });
    
    mockSupabase.in.mockImplementation(function() {
      return Promise.resolve({
        data: null,
        error: null
      });
    });
    
    // Call batchDelete
    const result = await batchOps.batchDelete(idsToDelete);
    
    // Check it performed bulk delete
    expect(mockSupabase.from).toHaveBeenCalledWith('test_table');
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(mockSupabase.in).toHaveBeenCalledWith('id', idsToDelete);
    
    // Check result
    expect(result.status).toBe('success');
    expect(result.data).toBe(true);
  });

  test('batchDelete with softDelete should update records instead of deleting them', async () => {
    // Create operations with softDelete option
    const batchOps = createBatchOperations<TestEntity, string>(
      'testEntity',
      'test_table',
      { softDelete: true }
    );
    
    // Setup test ids
    const idsToDelete = ['id-1', 'id-2'];
    
    // Setup mock
    mockSupabase.from.mockImplementation(function() { 
      return this;
    });
    
    mockSupabase.update.mockImplementation(function() {
      return this;
    });
    
    mockSupabase.in.mockImplementation(function() {
      return Promise.resolve({
        data: null,
        error: null
      });
    });
    
    // Call batchDelete
    await batchOps.batchDelete(idsToDelete);
    
    // Check it performed bulk update with deleted_at instead of delete
    expect(mockSupabase.from).toHaveBeenCalledWith('test_table');
    expect(mockSupabase.update).toHaveBeenCalled();
    expect(mockSupabase.update.mock.calls[0][0]).toHaveProperty('deleted_at');
    expect(mockSupabase.in).toHaveBeenCalledWith('id', idsToDelete);
  });
});
