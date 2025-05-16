
import { createBatchOperations } from '@/api/core/factory/operations/batchOperations';
import { createChainableMock, createSuccessResponse } from '../../../utils/supabaseMockUtils';
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

  test('should perform batch create operation', async () => {
    const mockRepo = new MockRepository(TABLE_NAME);
    
    const operations = createBatchOperations(
      'Test Entity',
      TABLE_NAME as any, 
      { 
        repository: mockRepo
      }
    );

    const items = [
      { name: 'Item 1' },
      { name: 'Item 2' }
    ];

    // Call batchCreate
    const result = await operations.batchCreate(items);

    // Verify repository was used
    expect(mockRepo.getLastOperation()).toBe('insert');
    
    // Check result
    expect(result.status).toBe('success');
    expect(result.data).toHaveLength(2);
  });

  test('should perform batch update operation', async () => {
    // Create a repository with some initial data
    const initialData = [
      { id: 'id-1', name: 'Item 1' },
      { id: 'id-2', name: 'Item 2' }
    ];
    const mockRepo = new MockRepository(TABLE_NAME, initialData);
    
    const operations = createBatchOperations(
      'Test Entity',
      TABLE_NAME as any, 
      { 
        repository: mockRepo
      }
    );

    const updates = [
      { id: 'id-1', name: 'Updated Item 1' },
      { id: 'id-2', name: 'Updated Item 2' }
    ];

    // Call batchUpdate
    const result = await operations.batchUpdate(updates);

    // Check result
    expect(result.status).toBe('success');
    expect(result.data).toBe(true);
  });

  test('should perform batch delete operation', async () => {
    // Create a repository with some initial data
    const initialData = [
      { id: 'id-1', name: 'Item 1' },
      { id: 'id-2', name: 'Item 2' }
    ];
    const mockRepo = new MockRepository(TABLE_NAME, initialData);
    
    const operations = createBatchOperations(
      'Test Entity',
      TABLE_NAME as any, 
      { 
        repository: mockRepo 
      }
    );

    const ids = ['id-1', 'id-2'];

    // Call batchDelete
    const result = await operations.batchDelete(ids);

    // Check result
    expect(result.status).toBe('success');
    expect(result.data).toBe(true);
  });

  test('should handle errors in batch operations', async () => {
    const mockRepo = new MockRepository(TABLE_NAME);
    
    // Setup error response for insert operation
    mockRepo.setMockResponse('insert', {
      data: null,
      error: new Error('Database error')
    });

    const operations = createBatchOperations(
      'Test Entity',
      TABLE_NAME as any, 
      { 
        repository: mockRepo
      }
    );

    // Attempt batch create and expect error response
    const result = await operations.batchCreate([{ name: 'Test' }]);
    
    expect(result.status).toBe('error');
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('Database error');
  });

  test('should handle repository pattern', async () => {
    // Create a mock repository
    const mockRepo = new MockRepository(TABLE_NAME, [
      { id: 'existing-1', name: 'Existing Item 1' }
    ]);
    
    const operations = createBatchOperations(
      'Test Entity',
      TABLE_NAME as any,
      { repository: mockRepo }
    );
    
    // Test batch create with repository
    const newItems = [{ name: 'New Item 1' }];
    const createResult = await operations.batchCreate(newItems);
    
    // Verify repository was used
    expect(mockRepo.getLastOperation()).toBe('insert');
    expect(createResult.status).toBe('success');
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
    
    const mockRepo = new MockRepository(TABLE_NAME);
    
    // Create operations with transformations
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

    // Verify transformations were applied
    expect(transformRequest).toHaveBeenCalledTimes(2);
    expect(transformRequest).toHaveBeenCalledWith(items[0]);
    expect(transformRequest).toHaveBeenCalledWith(items[1]);
  });
});
