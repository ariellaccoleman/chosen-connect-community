
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
  });

  test('should perform batch delete operation with repository', async () => {
    // Setup ids to delete
    const ids = ['id-1', 'id-2'];
    
    // Setup a repository that already has the data
    const mockRepo = new MockRepository(TABLE_NAME, [
      { id: 'id-1', name: 'Item 1' },
      { id: 'id-2', name: 'Item 2' }
    ]);

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
    const operations = createBatchOperations(
      'Test Entity',
      TABLE_NAME as any,
      {
        repository: new MockRepository(TABLE_NAME),
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

    // Verify transformations were applied
    expect(transformRequest).toHaveBeenCalledTimes(2);
    expect(transformRequest).toHaveBeenCalledWith(items[0]);
    expect(transformRequest).toHaveBeenCalledWith(items[1]);
  });

  test('should handle both repository and legacy client implementations', async () => {
    // Test with the repository pattern
    const repoOperations = createBatchOperations(
      'Test Entity',
      TABLE_NAME as any,
      { repository: new MockRepository(TABLE_NAME) }
    );
    
    // Both should have the same interface
    expect(repoOperations).toHaveProperty('batchCreate');
    expect(repoOperations).toHaveProperty('batchUpdate');
    expect(repoOperations).toHaveProperty('batchDelete');
  });
});
