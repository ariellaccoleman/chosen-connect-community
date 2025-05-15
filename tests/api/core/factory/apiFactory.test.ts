
import { createApiOperations } from '@/api/core/factory/apiFactory';
import { mockSupabase, resetSupabaseMocks } from '../../../__mocks__/supabase';
import { setupMockQueryResponse } from '../../../utils/apiTestUtils';

// Create test entity type
interface TestEntity {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

describe('API Factory', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  test('creates operations with all expected methods', () => {
    const api = createApiOperations<TestEntity>('testEntity', 'test_entities');
    
    // Verify that all expected methods exist
    expect(api.getAll).toBeDefined();
    expect(api.getById).toBeDefined();
    expect(api.getByIds).toBeDefined();
    expect(api.create).toBeDefined();
    expect(api.update).toBeDefined();
    expect(api.delete).toBeDefined();
    expect(api.batchCreate).toBeDefined();
    expect(api.batchUpdate).toBeDefined();
    expect(api.batchDelete).toBeDefined();
  });

  test('getById uses correct table and ID', async () => {
    // Setup test data
    const testEntity: TestEntity = {
      id: 'test-123',
      name: 'Test Entity',
      created_at: new Date().toISOString()
    };
    
    // Create API
    const api = createApiOperations<TestEntity>('testEntity', 'test_entities');
    
    // Setup mock response
    setupMockQueryResponse(testEntity);
    
    // Call getById
    await api.getById('test-123');
    
    // Verify correct parameters used
    expect(mockSupabase.from).toHaveBeenCalledWith('test_entities');
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'test-123');
  });
  
  test('getById with custom idField', async () => {
    // Create API with custom ID field
    const api = createApiOperations<TestEntity>('testEntity', 'test_entities', {
      idField: 'custom_id'
    });
    
    // Setup mock
    setupMockQueryResponse({
      id: 'internal-id',
      custom_id: 'test-custom-123',
      name: 'Custom ID Entity',
      created_at: new Date().toISOString()
    });
    
    // Call getById
    await api.getById('test-custom-123');
    
    // Verify custom ID field used
    expect(mockSupabase.from).toHaveBeenCalledWith('test_entities');
    expect(mockSupabase.eq).toHaveBeenCalledWith('custom_id', 'test-custom-123');
  });
  
  test('transformResponse correctly transforms data', async () => {
    // Mock raw DB data
    const rawData = {
      id: 'test-123',
      name: 'Test Entity',
      description: 'A description',
      created_at: new Date().toISOString(),
      extra_field: 'This should be filtered out'
    };
    
    // Setup transformer
    const api = createApiOperations<TestEntity>('testEntity', 'test_entities', {
      transformResponse: (item) => ({
        id: item.id,
        name: item.name.toUpperCase(), // Transform to uppercase
        description: item.description,
        created_at: item.created_at
      })
    });
    
    // Setup mock
    mockSupabase.from.mockImplementation(function() { return this; });
    mockSupabase.select.mockImplementation(function() { return this; });
    mockSupabase.eq.mockImplementation(function() { return this; });
    mockSupabase.maybeSingle.mockResolvedValue({
      data: rawData,
      error: null
    });
    
    // Call API
    const result = await api.getById('test-123');
    
    // Verify transformation worked
    expect(result.data?.name).toBe('TEST ENTITY'); // Should be uppercase
    expect(result.data?.description).toBe('A description');
    expect(result.data).not.toHaveProperty('extra_field'); // Should be filtered out
  });
});
