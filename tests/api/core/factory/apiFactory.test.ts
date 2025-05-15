
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { createChainableMock, createSuccessResponse, testCreateBatchOperations } from '../../../utils/supabaseMockUtils';

// Setup mock client
const mockSupabase = createChainableMock();

// Test table name
const TABLE_NAME = 'test_table';

describe('API Factory', () => {
  beforeEach(() => {
    mockSupabase.reset();
    jest.clearAllMocks();
  });

  test('should create a factory with base operations', () => {
    const factory = createApiFactory<any>({
      tableName: TABLE_NAME,
      // Using a mock function to enable testing the provided client
      clientFn: () => mockSupabase
    });

    // Check basic structure
    expect(factory).toHaveProperty('getAll');
    expect(factory).toHaveProperty('getById');
    expect(factory).toHaveProperty('create');
    expect(factory).toHaveProperty('update');
    expect(factory).toHaveProperty('delete');
    expect(factory).toHaveProperty('tableName');
  });

  test('should create a factory with extended query operations', () => {
    const factory = createApiFactory<any>({
      tableName: TABLE_NAME,
      clientFn: () => mockSupabase,
      useQueryOperations: true
    });

    // Check query operations
    expect(factory).toHaveProperty('query');
    expect(factory).toHaveProperty('queryById');
  });

  test('should create a factory with extended mutation operations', () => {
    const factory = createApiFactory<any>({
      tableName: TABLE_NAME,
      clientFn: () => mockSupabase,
      useMutationOperations: true
    });

    // Check mutation operations
    expect(factory).toHaveProperty('createOne');
    expect(factory).toHaveProperty('updateOne');
    expect(factory).toHaveProperty('deleteOne');
  });

  test('should create a factory with extended batch operations', () => {
    const factory = createApiFactory<any>({
      tableName: TABLE_NAME,
      clientFn: () => mockSupabase,
      useBatchOperations: true
    });

    // Check batch operations
    expect(factory).toHaveProperty('batchCreate');
    expect(factory).toHaveProperty('batchUpdate');
    expect(factory).toHaveProperty('batchDelete');
  });

  test('should enable all operations when requested', () => {
    const factory = createApiFactory<any>({
      tableName: TABLE_NAME,
      clientFn: () => mockSupabase,
      useQueryOperations: true,
      useMutationOperations: true,
      useBatchOperations: true
    });

    // Check that all operations are present
    expect(factory).toHaveProperty('getAll');
    expect(factory).toHaveProperty('query');
    expect(factory).toHaveProperty('createOne');
    expect(factory).toHaveProperty('batchCreate');
  });

  test('should allow custom formatters', async () => {
    // Mock formatter function
    const mockFormatter = jest.fn((data) => ({
      ...data,
      formatted: true
    }));

    const factory = createApiFactory<any>({
      tableName: TABLE_NAME,
      clientFn: () => mockSupabase,
      formatters: {
        formatItem: mockFormatter
      }
    });

    // Setup mock response
    mockSupabase.mockResponseFor(TABLE_NAME, createSuccessResponse([{ id: 'test-1', name: 'Test Item' }]));

    // Call getAll
    await factory.getAll();

    // Verify formatter was called
    expect(mockFormatter).toHaveBeenCalled();
  });

  test('should allow custom select statements', async () => {
    const customSelect = 'id, name, custom_field';
    
    const factory = createApiFactory<any>({
      tableName: TABLE_NAME,
      clientFn: () => mockSupabase,
      defaultSelect: customSelect
    });

    // Setup mock response
    mockSupabase.mockResponseFor(TABLE_NAME, createSuccessResponse([{ id: 'test-1', name: 'Test Item' }]));

    // Call getAll
    await factory.getAll();

    // Verify custom select was used
    expect(mockSupabase.select).toHaveBeenCalledWith(customSelect);
  });
});
