
import { createBatchOperations } from '@/api/core/factory/operations/batchOperations';
import { createChainableMock, createSuccessResponse, testCreateBatchOperations } from '../../../../utils/supabaseMockUtils';

// Setup mock client
const mockSupabase = createChainableMock();

// Test table name
const TABLE_NAME = 'test_table';

describe('Batch Operations', () => {
  beforeEach(() => {
    mockSupabase.reset();
    jest.clearAllMocks();
  });

  test('should create batch operations object', () => {
    const operations = testCreateBatchOperations({
      tableName: TABLE_NAME,
      clientFn: () => mockSupabase
    });

    expect(operations).toHaveProperty('batchCreate');
    expect(operations).toHaveProperty('batchUpdate');
    expect(operations).toHaveProperty('batchDelete');
  });

  test('should perform batch create operation', async () => {
    const operations = testCreateBatchOperations({
      tableName: TABLE_NAME,
      clientFn: () => mockSupabase
    });

    const items = [
      { name: 'Item 1' },
      { name: 'Item 2' }
    ];

    // Setup mock response
    mockSupabase.mockResponseFor(TABLE_NAME, createSuccessResponse([
      { id: 'id-1', name: 'Item 1' },
      { id: 'id-2', name: 'Item 2' }
    ]));

    // Call batchCreate
    const result = await operations.batchCreate(items);

    // Verify Supabase was called correctly
    expect(mockSupabase.from).toHaveBeenCalledWith(TABLE_NAME);
    expect(mockSupabase.insert).toHaveBeenCalledWith(items);

    // Check result
    expect(result.status).toBe('success');
    expect(result.data).toHaveLength(2);
  });

  test('should perform batch update operation', async () => {
    const operations = testCreateBatchOperations({
      tableName: TABLE_NAME,
      clientFn: () => mockSupabase
    });

    const updates = [
      { id: 'id-1', name: 'Updated Item 1' },
      { id: 'id-2', name: 'Updated Item 2' }
    ];

    // Setup mock response
    mockSupabase.mockResponseFor(TABLE_NAME, createSuccessResponse(null));

    // Call batchUpdate
    const result = await operations.batchUpdate(updates);

    // Verify Supabase was called correctly
    expect(mockSupabase.from).toHaveBeenCalledWith(TABLE_NAME);
    expect(mockSupabase.upsert).toHaveBeenCalledWith(updates);

    // Check result
    expect(result.status).toBe('success');
    expect(result.data).toBe(true);
  });

  test('should perform batch delete operation', async () => {
    const operations = testCreateBatchOperations({
      tableName: TABLE_NAME,
      clientFn: () => mockSupabase
    });

    const ids = ['id-1', 'id-2'];

    // Setup mock response
    mockSupabase.mockResponseFor(TABLE_NAME, createSuccessResponse(null));

    // Call batchDelete
    const result = await operations.batchDelete(ids);

    // Verify Supabase was called correctly
    expect(mockSupabase.from).toHaveBeenCalledWith(TABLE_NAME);
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(mockSupabase.in).toHaveBeenCalledWith('id', ids);

    // Check result
    expect(result.status).toBe('success');
    expect(result.data).toBe(true);
  });

  test('should handle errors in batch operations', async () => {
    const operations = testCreateBatchOperations({
      tableName: TABLE_NAME,
      clientFn: () => mockSupabase
    });

    // Setup error response
    mockSupabase.from.mockImplementation(() => {
      throw new Error('Database error');
    });

    // Attempt batch create and expect error
    let error;
    try {
      await operations.batchCreate([{ name: 'Test' }]);
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.message).toBe('Database error');
  });
});
