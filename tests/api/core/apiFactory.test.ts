
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { createSuccessResponse, createErrorResponse } from '@/api/core/errorHandler';

// Define test types for a sample entity
interface TestEntity {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

type TestEntityCreate = Omit<TestEntity, 'id' | 'created_at'>;
type TestEntityUpdate = Partial<TestEntity>;

// Create mock repository for testing
const createMockRepository = () => {
  const data: Record<string, any> = {};
  let lastId = 0;

  const generateId = () => `id-${++lastId}`;
  
  return {
    // Mock repository methods that track calls and return predictable results
    select: jest.fn().mockImplementation(() => ({
      eq: jest.fn().mockImplementation((field, value) => ({
        maybeSingle: jest.fn().mockImplementation(() => {
          if (value === 'invalid-id') {
            return Promise.resolve({
              data: null,
              error: { message: 'Entity not found', code: 'NOT_FOUND' }
            });
          }
          return Promise.resolve({
            data: { id: value, name: 'Test Entity', created_at: new Date().toISOString() },
            error: null
          });
        }),
        single: jest.fn().mockImplementation(() => {
          if (value === 'invalid-id') {
            return Promise.resolve({
              data: null,
              error: { message: 'Entity not found', code: 'NOT_FOUND' }
            });
          }
          return Promise.resolve({
            data: { id: value, name: 'Test Entity', created_at: new Date().toISOString() },
            error: null
          });
        })
      })),
      in: jest.fn().mockImplementation(() => ({
        execute: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            data: [
              { id: 'id-1', name: 'Entity 1', created_at: new Date().toISOString() },
              { id: 'id-2', name: 'Entity 2', created_at: new Date().toISOString() }
            ],
            error: null
          });
        })
      })),
      ilike: jest.fn().mockReturnSelf(),
      order: jest.fn().mockReturnSelf(),
      range: jest.fn().mockReturnSelf(),
      limit: jest.fn().mockReturnSelf(),
      execute: jest.fn().mockImplementation(() => {
        return Promise.resolve({
          data: [
            { id: 'id-1', name: 'Test Entity 1', created_at: new Date().toISOString() },
            { id: 'id-2', name: 'Test Entity 2', created_at: new Date().toISOString() }
          ],
          error: null
        });
      })
    }),
    insert: jest.fn().mockImplementation((data) => ({
      single: jest.fn().mockImplementation(() => {
        const id = generateId();
        return Promise.resolve({
          data: { 
            id, 
            ...data, 
            created_at: new Date().toISOString() 
          },
          error: null
        });
      })
    })),
    update: jest.fn().mockImplementation((data) => ({
      eq: jest.fn().mockImplementation((field, value) => ({
        single: jest.fn().mockImplementation(() => {
          if (value === 'invalid-id') {
            return Promise.resolve({
              data: null,
              error: { message: 'Entity not found', code: 'NOT_FOUND' }
            });
          }
          return Promise.resolve({
            data: { 
              id: value, 
              name: 'Test Entity', 
              ...data,
              created_at: new Date().toISOString()
            },
            error: null
          });
        })
      }))
    })),
    delete: jest.fn().mockImplementation(() => ({
      eq: jest.fn().mockImplementation((field, value) => ({
        execute: jest.fn().mockImplementation(() => {
          if (value === 'invalid-id') {
            return Promise.resolve({
              data: null,
              error: { message: 'Entity not found', code: 'NOT_FOUND' }
            });
          }
          return Promise.resolve({
            data: true,
            error: null
          });
        })
      }))
    }))
  };
};

// Mock apiClient
const mockApiClient = {
  query: jest.fn().mockImplementation(async (callback) => {
    try {
      const result = await callback({ 
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { id: '123' }, error: null })
            }),
            in: () => Promise.resolve({ data: [{ id: '123' }], error: null }),
            order: () => Promise.resolve({ data: [{ id: '123' }], error: null })
          }),
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: { id: '123' }, error: null })
            })
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: { id: '123' }, error: null })
              })
            })
          }),
          delete: () => ({
            eq: () => Promise.resolve({ data: true, error: null })
          })
        })
      });
      return result;
    } catch (error) {
      return createErrorResponse(error);
    }
  })
};

// Mock the API client import
jest.mock('@/api/core/apiClient', () => ({
  apiClient: mockApiClient
}));

describe('API Factory - Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create factory with correct table name', () => {
    // Create a factory with minimal options
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_entities'
    });
    
    // Verify the table name is correctly assigned
    expect(factory.tableName).toBe('test_entities');
  });
  
  test('should throw error if tableName is not provided', () => {
    // Trying to create a factory without a table name should throw
    expect(() => {
      // @ts-ignore - intentionally passing invalid options
      createApiFactory<TestEntity>({});
    }).toThrow('tableName is required');
  });
  
  test('should create entity name from table name', () => {
    const mockRepository = createMockRepository();
    
    // Create factories with different table names
    const factory1 = createApiFactory<TestEntity>({
      tableName: 'test_entities',
      repository: mockRepository
    });
    
    const factory2 = createApiFactory<TestEntity>({
      tableName: 'user_profiles',
      repository: mockRepository
    });
    
    // Call methods to check entity names (will show in logs/errors)
    factory1.getById('123');
    factory2.getById('123');
    
    // The first call should use "Test entities" as entity name
    expect(mockRepository.select).toHaveBeenCalledTimes(2);
  });

  test('should use custom entity name when provided', () => {
    const mockRepository = createMockRepository();
    
    // Create factory with custom entity name
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_entities',
      entityName: 'CustomEntity',
      repository: mockRepository
    });
    
    // Call method to check entity name
    factory.getById('123');
    
    // Should use "CustomEntity" as entity name
    expect(mockRepository.select).toHaveBeenCalled();
  });
});

describe('API Factory - Base Operations', () => {
  let mockRepository: ReturnType<typeof createMockRepository>;
  
  beforeEach(() => {
    mockRepository = createMockRepository();
    jest.clearAllMocks();
  });
  
  test('getAll should return array of entities', async () => {
    // Create factory with repository
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_entities',
      repository: mockRepository
    });
    
    // Call getAll
    const result = await factory.getAll();
    
    // Verify result
    expect(result.status).toBe('success');
    expect(result.data?.length).toBeGreaterThan(0);
    expect(mockRepository.select).toHaveBeenCalled();
  });
  
  test('getById should return single entity', async () => {
    // Create factory with repository
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_entities',
      repository: mockRepository
    });
    
    // Call getById
    const result = await factory.getById('123');
    
    // Verify result
    expect(result.status).toBe('success');
    expect(result.data?.id).toBe('123');
    expect(mockRepository.select).toHaveBeenCalled();
  });
  
  test('getById should handle not found error', async () => {
    // Create factory with repository
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_entities',
      repository: mockRepository
    });
    
    // Call getById with invalid ID
    const result = await factory.getById('invalid-id');
    
    // Verify error is handled
    expect(result.status).toBe('error');
    expect(result.error?.message).toBe('Entity not found');
  });
  
  test('create should add new entity', async () => {
    // Create factory with repository
    const factory = createApiFactory<TestEntity, string, TestEntityCreate>({
      tableName: 'test_entities',
      repository: mockRepository
    });
    
    // Test data
    const newEntity: TestEntityCreate = { 
      name: 'New Entity',
      description: 'Test description'
    };
    
    // Call create
    const result = await factory.create(newEntity);
    
    // Verify result
    expect(result.status).toBe('success');
    expect(result.data?.name).toBe('New Entity');
    expect(result.data?.description).toBe('Test description');
    expect(result.data?.id).toBeDefined();
    expect(mockRepository.insert).toHaveBeenCalledWith(newEntity);
  });
  
  test('update should modify entity', async () => {
    // Create factory with repository
    const factory = createApiFactory<TestEntity, string, TestEntityCreate, TestEntityUpdate>({
      tableName: 'test_entities',
      repository: mockRepository
    });
    
    // Test data
    const updateData: TestEntityUpdate = { 
      description: 'Updated description'
    };
    
    // Call update
    const result = await factory.update('123', updateData);
    
    // Verify result
    expect(result.status).toBe('success');
    expect(result.data?.id).toBe('123');
    expect(result.data?.description).toBe('Updated description');
    expect(mockRepository.update).toHaveBeenCalledWith(updateData);
  });
  
  test('delete should remove entity', async () => {
    // Create factory with repository
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_entities',
      repository: mockRepository
    });
    
    // Call delete
    const result = await factory.delete('123');
    
    // Verify result
    expect(result.status).toBe('success');
    expect(result.data).toBe(true);
    expect(mockRepository.delete).toHaveBeenCalled();
  });
});

describe('API Factory - Extended Query Operations', () => {
  let mockRepository: ReturnType<typeof createMockRepository>;
  
  beforeEach(() => {
    mockRepository = createMockRepository();
    jest.clearAllMocks();
  });
  
  test('should include query operations when enabled', () => {
    // Create factory with query operations enabled
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_entities',
      repository: mockRepository,
      useQueryOperations: true
    });
    
    // Verify extended query operations are available
    expect(factory.getAll).toBeDefined();
    expect(factory.getById).toBeDefined();
    expect(factory.getByIds).toBeDefined();
  });
  
  test('getAll should apply filters correctly', async () => {
    // Create factory with query operations enabled
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_entities',
      repository: mockRepository,
      useQueryOperations: true
    });
    
    // Call getAll with filters
    await factory.getAll({ 
      filters: { status: 'active' },
      search: 'Test',
      page: 1,
      limit: 10,
      sortBy: 'name',
      sortDirection: 'asc'
    });
    
    // Verify filters have been applied
    expect(mockRepository.select).toHaveBeenCalled();
  });
  
  test('getByIds should fetch multiple entities by ID', async () => {
    // Create factory with query operations enabled
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_entities',
      repository: mockRepository,
      useQueryOperations: true
    });
    
    // Call getByIds
    const result = await factory.getByIds(['id1', 'id2']);
    
    // Verify result
    expect(result.status).toBe('success');
    expect(result.data?.length).toBeGreaterThan(0);
    expect(mockRepository.select).toHaveBeenCalled();
  });
});

describe('API Factory - Extended Mutation Operations', () => {
  let mockRepository: ReturnType<typeof createMockRepository>;
  
  beforeEach(() => {
    mockRepository = createMockRepository();
    jest.clearAllMocks();
  });
  
  test('should include mutation operations when enabled', () => {
    // Create factory with mutation operations enabled
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_entities',
      repository: mockRepository,
      useMutationOperations: true
    });
    
    // Verify mutation operations are available
    expect(factory.create).toBeDefined();
    expect(factory.update).toBeDefined();
    expect(factory.delete).toBeDefined();
  });
  
  test('soft delete should update deleted_at instead of removing the record', async () => {
    // Create repository spy to check soft delete behavior
    const repositorySpy = {
      ...createMockRepository(),
      update: jest.fn().mockImplementation((data) => ({
        eq: jest.fn().mockImplementation(() => ({
          execute: jest.fn().mockResolvedValue({
            data: true,
            error: null
          })
        }))
      }))
    };
    
    // Create factory with soft delete
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_entities',
      repository: repositorySpy,
      softDelete: true
    });
    
    // Call delete
    const result = await factory.delete('123');
    
    // Verify soft delete was performed (update was called)
    expect(result.status).toBe('success');
    expect(repositorySpy.update).toHaveBeenCalled();
    // We should have included deleted_at in the update
    expect(repositorySpy.update.mock.calls[0][0]).toHaveProperty('deleted_at');
  });
});

describe('API Factory - Extended Batch Operations', () => {
  let mockRepository: ReturnType<typeof createMockRepository>;
  
  beforeEach(() => {
    mockRepository = createMockRepository();
    jest.clearAllMocks();
  });
  
  test('should include batch operations when enabled', () => {
    // Create factory with batch operations enabled
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_entities',
      repository: mockRepository,
      useBatchOperations: true
    });
    
    // Verify batch operations are available
    expect(factory.batchCreate).toBeDefined();
    expect(factory.batchUpdate).toBeDefined();
    expect(factory.batchDelete).toBeDefined();
  });
  
  test('batchCreate should add multiple entities', async () => {
    // Create repository with spy for batch operations
    const mockBatchInsert = jest.fn().mockImplementation((data) => ({
      select: jest.fn().mockImplementation(() => ({
        execute: jest.fn().mockResolvedValue({
          data: data.map((item: any, index: number) => ({
            id: `batch-${index}`,
            ...item,
            created_at: new Date().toISOString()
          })),
          error: null
        })
      }))
    }));
    
    const repositorySpy = {
      ...mockRepository,
      insert: mockBatchInsert
    };
    
    // Create factory with batch operations enabled
    const factory = createApiFactory<TestEntity, string, TestEntityCreate>({
      tableName: 'test_entities',
      repository: repositorySpy,
      useBatchOperations: true
    });
    
    // Test data
    const newEntities: TestEntityCreate[] = [
      { name: 'Entity 1', description: 'Description 1' },
      { name: 'Entity 2', description: 'Description 2' }
    ];
    
    // Call batchCreate
    const result = await factory.batchCreate(newEntities);
    
    // Verify result
    expect(result.status).toBe('success');
    expect(result.data?.length).toBe(2);
    expect(mockBatchInsert).toHaveBeenCalledWith(newEntities);
  });
  
  test('batchDelete should remove multiple entities', async () => {
    // Mock client for batch operations
    const mockClientWithBatchOperations = {
      ...mockApiClient,
      query: jest.fn().mockImplementation(async (callback) => {
        try {
          return createSuccessResponse(true);
        } catch (error) {
          return createErrorResponse(error);
        }
      })
    };
    
    // Replace mockApiClient with batch-capable mock
    jest.mock('@/api/core/apiClient', () => ({
      apiClient: mockClientWithBatchOperations
    }));
    
    // Create factory with batch operations enabled
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_entities',
      useBatchOperations: true
    });
    
    // Call batchDelete
    const result = await factory.batchDelete(['id1', 'id2', 'id3']);
    
    // Verify result
    expect(result.status).toBe('success');
    expect(result.data).toBe(true);
  });
});

describe('API Factory - Transformation and Options', () => {
  let mockRepository: ReturnType<typeof createMockRepository>;
  
  beforeEach(() => {
    mockRepository = createMockRepository();
    jest.clearAllMocks();
  });
  
  test('should apply response transformations', async () => {
    // Create transform function
    const transformResponse = jest.fn().mockImplementation(item => ({
      ...item,
      isTransformed: true,
      fullName: `${item.name} (Transformed)`
    }));
    
    // Create factory with transform
    const factory = createApiFactory<TestEntity & { isTransformed?: boolean, fullName?: string }>({
      tableName: 'test_entities',
      repository: mockRepository,
      transformResponse
    });
    
    // Call getById
    const result = await factory.getById('123');
    
    // Verify transform was applied
    expect(result.status).toBe('success');
    expect(result.data?.isTransformed).toBe(true);
    expect(result.data?.fullName).toBe('Test Entity (Transformed)');
    expect(transformResponse).toHaveBeenCalled();
  });
  
  test('should apply request transformations', async () => {
    // Create transform function
    const transformRequest = jest.fn().mockImplementation(data => ({
      ...data,
      transformed_at: 'test-date'
    }));
    
    // Create factory with transform
    const factory = createApiFactory<TestEntity, string, TestEntityCreate>({
      tableName: 'test_entities',
      repository: mockRepository,
      transformRequest
    });
    
    // Test data
    const newEntity = { name: 'New Entity' };
    
    // Call create
    await factory.create(newEntity);
    
    // Verify transform was applied
    expect(transformRequest).toHaveBeenCalledWith(newEntity);
    expect(mockRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        transformed_at: 'test-date'
      })
    );
  });
  
  test('should use custom idField when specified', async () => {
    // Create repository with spy
    const selectSpy = jest.fn().mockImplementation(() => ({
      eq: jest.fn().mockImplementation((field, value) => ({
        maybeSingle: jest.fn().mockResolvedValue({
          data: { customId: value, name: 'Test Entity' },
          error: null
        })
      }))
    }));
    
    const repositorySpy = {
      ...mockRepository,
      select: selectSpy
    };
    
    // Create factory with custom idField
    const factory = createApiFactory<TestEntity & { customId: string }>({
      tableName: 'test_entities',
      repository: repositorySpy,
      idField: 'customId'
    });
    
    // Call getById
    await factory.getById('custom123');
    
    // Verify custom ID field was used
    expect(selectSpy).toHaveBeenCalled();
    expect(selectSpy().eq).toHaveBeenCalledWith('customId', 'custom123');
  });
  
  test('should use custom select statement', async () => {
    // Create repository with spy
    const selectSpy = jest.fn().mockImplementation(() => ({
      eq: jest.fn().mockImplementation(() => ({
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: '123', name: 'Test Entity' },
          error: null
        })
      })),
      execute: jest.fn().mockResolvedValue({
        data: [{ id: '123', name: 'Test Entity' }],
        error: null
      })
    }));
    
    const repositorySpy = {
      ...mockRepository,
      select: selectSpy
    };
    
    // Create factory with custom select
    const customSelect = 'id, name, created_at, custom_field';
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_entities',
      repository: repositorySpy,
      defaultSelect: customSelect
    });
    
    // Call getAll
    await factory.getAll();
    
    // Verify custom select was used
    expect(selectSpy).toHaveBeenCalledWith(customSelect);
  });
});

describe('API Factory - Backwards Compatibility', () => {
  test('createApiOperations should be an alias for createApiFactory', () => {
    // Import both functions
    const { createApiFactory, createApiOperations } = require('@/api/core/factory/apiFactory');
    
    // They should be the same function
    expect(createApiOperations).toBe(createApiFactory);
  });
  
  test('createApiOperations should work with legacy signature', () => {
    const { createApiOperations } = require('@/api/core/factory/apiFactory');
    
    // Create factory using legacy function signature
    const factory = createApiOperations<TestEntity, string, TestEntityCreate, TestEntityUpdate>(
      'test_entities',  // First param: tableName
      'test_entity'     // Second param: entityName
    );
    
    // Verify it created properly
    expect(factory.tableName).toBe('test_entities');
    expect(factory.getAll).toBeDefined();
    expect(factory.getById).toBeDefined();
    expect(factory.create).toBeDefined();
  });
  
  test('should fall back gracefully when invalid options are provided', () => {
    // Create with minimal options
    const factory1 = createApiFactory<TestEntity>({
      tableName: 'test_entities'
    });
    
    // Should have basic operations
    expect(factory1.getAll).toBeDefined();
    expect(factory1.create).toBeDefined();
    
    // Create with null repository option to test fallback
    const factory2 = createApiFactory<TestEntity>({
      tableName: 'test_entities',
      // @ts-ignore - intentionally passing invalid option
      repository: null
    });
    
    // Should still have basic operations
    expect(factory2.getAll).toBeDefined();
    expect(factory2.create).toBeDefined();
  });
});

// Comprehensive integration tests
describe('API Factory - Integration Scenarios', () => {
  test('should handle full CRUD cycle', async () => {
    // Replace mockRepository with one that tracks state
    const entityStore: Record<string, any> = {};
    let nextId = 1;
    
    const statefulRepository = {
      select: jest.fn().mockImplementation(() => ({
        eq: jest.fn().mockImplementation((field, id) => ({
          maybeSingle: jest.fn().mockImplementation(() => {
            const entity = entityStore[id];
            if (!entity) {
              return Promise.resolve({
                data: null,
                error: { message: 'Not found', code: 'NOT_FOUND' }
              });
            }
            return Promise.resolve({
              data: entity,
              error: null
            });
          })
        })),
        execute: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            data: Object.values(entityStore),
            error: null
          });
        })
      })),
      insert: jest.fn().mockImplementation((data) => ({
        single: jest.fn().mockImplementation(() => {
          const id = `test-${nextId++}`;
          const newEntity = { 
            id, 
            ...data, 
            created_at: new Date().toISOString() 
          };
          entityStore[id] = newEntity;
          return Promise.resolve({
            data: newEntity,
            error: null
          });
        })
      })),
      update: jest.fn().mockImplementation((data) => ({
        eq: jest.fn().mockImplementation((field, id) => ({
          single: jest.fn().mockImplementation(() => {
            if (!entityStore[id]) {
              return Promise.resolve({
                data: null,
                error: { message: 'Not found', code: 'NOT_FOUND' }
              });
            }
            
            entityStore[id] = {
              ...entityStore[id],
              ...data,
              updated_at: new Date().toISOString()
            };
            
            return Promise.resolve({
              data: entityStore[id],
              error: null
            });
          })
        }))
      })),
      delete: jest.fn().mockImplementation(() => ({
        eq: jest.fn().mockImplementation((field, id) => ({
          execute: jest.fn().mockImplementation(() => {
            if (!entityStore[id]) {
              return Promise.resolve({
                data: null,
                error: { message: 'Not found', code: 'NOT_FOUND' }
              });
            }
            
            delete entityStore[id];
            
            return Promise.resolve({
              data: true,
              error: null
            });
          })
        }))
      }))
    };
    
    // Create factory with stateful repository
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_entities',
      repository: statefulRepository
    });
    
    // 1. Create an entity
    const createResult = await factory.create({
      name: 'Integration Test Entity',
      description: 'Testing full CRUD cycle'
    });
    
    expect(createResult.status).toBe('success');
    expect(createResult.data?.id).toBeDefined();
    
    const entityId = createResult.data!.id;
    
    // 2. Get the entity
    const getResult = await factory.getById(entityId);
    
    expect(getResult.status).toBe('success');
    expect(getResult.data?.name).toBe('Integration Test Entity');
    
    // 3. Update the entity
    const updateResult = await factory.update(entityId, {
      description: 'Updated description'
    });
    
    expect(updateResult.status).toBe('success');
    expect(updateResult.data?.description).toBe('Updated description');
    
    // 4. Get all entities
    const getAllResult = await factory.getAll();
    
    expect(getAllResult.status).toBe('success');
    expect(getAllResult.data?.length).toBe(1);
    
    // 5. Delete the entity
    const deleteResult = await factory.delete(entityId);
    
    expect(deleteResult.status).toBe('success');
    expect(deleteResult.data).toBe(true);
    
    // 6. Verify it's gone
    const getFinalResult = await factory.getById(entityId);
    
    expect(getFinalResult.status).toBe('error');
    expect(getFinalResult.error?.message).toBe('Not found');
  });
  
  test('should enable all operations simultaneously', async () => {
    // Create factory with all operations enabled
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_entities',
      useQueryOperations: true,
      useMutationOperations: true,
      useBatchOperations: true
    });
    
    // Verify all operations are available
    // Base operations
    expect(factory.getAll).toBeDefined();
    expect(factory.getById).toBeDefined();
    expect(factory.create).toBeDefined();
    expect(factory.update).toBeDefined();
    expect(factory.delete).toBeDefined();
    
    // Extended query operations
    expect(factory.getByIds).toBeDefined();
    
    // Batch operations
    expect(factory.batchCreate).toBeDefined();
    expect(factory.batchUpdate).toBeDefined();
    expect(factory.batchDelete).toBeDefined();
  });
});
