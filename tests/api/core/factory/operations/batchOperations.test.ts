
import { createBatchOperations } from '@/api/core/factory/operations/batchOperations';
import { createMockBatchOperations } from '../../../../utils/supabaseMockUtils';
import { MockRepository } from '@/api/core/repository/MockRepository';

// Test table name
const TABLE_NAME = 'test_table';

describe('Batch Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create batch operations object', () => {
    // Create operations with the repository pattern
    const operations = createBatchOperations(
      'Test Entity',
      TABLE_NAME as any,
      {
        repository: new MockRepository(TABLE_NAME)
      }
    );

    expect(operations).toHaveProperty('batchCreate');
    expect(operations).toHaveProperty('batchUpdate');
    expect(operations).toHaveProperty('batchDelete');
  });

  test('should perform batch create operation with repository', async () => {
    // Setup mock data and repository
    const mockItems = [
      { name: 'Item 1' },
      { name: 'Item 2' }
    ];
    
    const mockRepo = new MockRepository(TABLE_NAME, []);
    
    const operations = createBatchOperations(
      'Test Entity',
      TABLE_NAME as any,
      { repository: mockRepo }
    );

    // Call batchCreate
    const result = await operations.batchCreate(mockItems);

    // Verify result
    expect(result.status).toBe('success');
    expect(result.data).toHaveLength(2);
    expect(mockRepo.getLastOperation()).toBe('insert');
    
    // Check that both items were inserted
    expect(mockRepo.getLastData()).toEqual([
      { name: 'Item 1' },
      { name: 'Item 2' }
    ]);
  });

  test('should perform batch update operation with repository', async () => {
    // Setup mock data
    const updates = [
      { id: 'id-1', name: 'Updated Item 1' },
      { id: 'id-2', name: 'Updated Item 2' }
    ];
    
    // Setup a repository that already has some data
    const mockRepo = new MockRepository(TABLE_NAME, [
      { id: 'id-1', name: 'Item 1' },
      { id: 'id-2', name: 'Item 2' }
    ]);
    
    // Spy on repository methods
    const updateSpy = jest.spyOn(mockRepo, 'update');
    
    const operations = createBatchOperations(
      'Test Entity',
      TABLE_NAME as any,
      { repository: mockRepo }
    );

    // Call batchUpdate
    const result = await operations.batchUpdate(updates);

    // Verify result
    expect(result.status).toBe('success');
    expect(result.data).toBe(true);
    
    // Verify repository interactions - should call update twice (once for each item)
    expect(updateSpy).toHaveBeenCalledTimes(2);
    expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({
      id: 'id-1',
      name: 'Updated Item 1'
    }));
    expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({
      id: 'id-2',
      name: 'Updated Item 2'
    }));
  });

  test('should perform batch delete operation with repository', async () => {
    // Setup ids to delete
    const ids = ['id-1', 'id-2'];
    
    // Setup a repository that already has the data
    const mockRepo = new MockRepository(TABLE_NAME, [
      { id: 'id-1', name: 'Item 1' },
      { id: 'id-2', name: 'Item 2' }
    ]);
    
    // Spy on repository methods
    const deleteSpy = jest.spyOn(mockRepo, 'delete');
    const inSpy = jest.spyOn(MockQuery.prototype, 'in');
    
    const operations = createBatchOperations(
      'Test Entity',
      TABLE_NAME as any,
      { repository: mockRepo }
    );

    // Call batchDelete
    const result = await operations.batchDelete(ids);

    // Verify result
    expect(result.status).toBe('success');
    expect(result.data).toBe(true);
    
    // Verify repository interactions
    expect(deleteSpy).toHaveBeenCalledTimes(1);
    expect(inSpy).toHaveBeenCalledWith('id', ids);
  });

  test('should handle errors in batch create operation', async () => {
    // Create a repository that will throw an error on insert
    const mockRepo = new MockRepository(TABLE_NAME);
    mockRepo.setMockResponse('insert', {
      data: null,
      error: new Error('Database error')
    });

    const operations = createBatchOperations(
      'Test Entity',
      TABLE_NAME as any,
      { repository: mockRepo }
    );

    // Call batchCreate and expect error response
    const result = await operations.batchCreate([{ name: 'Test' }]);
    
    // Should handle the error and return an error response
    expect(result.status).toBe('error');
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('Database error');
  });

  test('should apply transformations for batch operations', async () => {
    // Setup transformations
    const transformRequest = jest.fn(item => ({
      ...item,
      transformed: true
    }));
    
    const transformResponse = jest.fn(item => ({
      ...item,
      displayName: `${item.name} (Transformed)`
    }));
    
    // Create operations with transformations
    const mockRepo = new MockRepository(TABLE_NAME);
    const operations = createBatchOperations(
      'Test Entity',
      TABLE_NAME as any,
      {
        repository: mockRepo,
        transformRequest,
        transformResponse
      }
    );

    // Test data
    const items = [
      { name: 'Item 1' },
      { name: 'Item 2' }
    ];

    // Call batchCreate
    await operations.batchCreate(items);

    // Verify transformations were applied to each item individually
    expect(transformRequest).toHaveBeenCalledTimes(2);
    expect(transformRequest).toHaveBeenCalledWith(items[0]);
    expect(transformRequest).toHaveBeenCalledWith(items[1]);
    
    // Verify inserted data includes transformations
    expect(mockRepo.getLastData()).toEqual([
      { name: 'Item 1', transformed: true },
      { name: 'Item 2', transformed: true }
    ]);
  });
  
  test('should soft delete when option is enabled', async () => {
    // Setup ids to delete
    const ids = ['id-1', 'id-2'];
    
    // Setup a repository that already has the data
    const mockRepo = new MockRepository(TABLE_NAME, [
      { id: 'id-1', name: 'Item 1' },
      { id: 'id-2', name: 'Item 2' }
    ]);
    
    // Spy on repository methods
    const updateSpy = jest.spyOn(mockRepo, 'update');
    const inSpy = jest.spyOn(MockQuery.prototype, 'in');
    
    const operations = createBatchOperations(
      'Test Entity',
      TABLE_NAME as any,
      { 
        repository: mockRepo,
        softDelete: true
      }
    );

    // Call batchDelete with soft delete enabled
    const result = await operations.batchDelete(ids);

    // Verify result
    expect(result.status).toBe('success');
    expect(result.data).toBe(true);
    
    // Verify repository interactions - should use update instead of delete
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(inSpy).toHaveBeenCalledWith('id', ids);
    
    // Verify update was called with deleted_at timestamp
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ 
        deleted_at: expect.any(String) 
      })
    );
  });
});

// Mock MockQuery for testing
class MockQuery<T> {
  static prototype = {
    in: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ data: [], error: null }),
    eq: jest.fn().mockReturnThis()
  };
  
  in() { return this; }
  execute() { return Promise.resolve({ data: [], error: null }); }
  eq() { return this; }
}
