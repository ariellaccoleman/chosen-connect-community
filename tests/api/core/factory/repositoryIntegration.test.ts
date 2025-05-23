
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { createRepository } from '@/api/core/repository/repositoryFactory';
import { DataRepository } from '@/api/core/repository/DataRepository';
import { RepositoryResponse } from '@/api/core/repository/DataRepository';

// Mock the repository factory
jest.mock('@/api/core/repository/repositoryFactory', () => {
  const mockRepository = {
    select: jest.fn(() => mockRepository),
    insert: jest.fn(() => mockRepository),
    update: jest.fn(() => mockRepository),
    delete: jest.fn(() => mockRepository),
    eq: jest.fn(() => mockRepository),
    execute: jest.fn().mockImplementation(function() {
      console.log('[Mock Repository] execute called');
      return Promise.resolve({ 
        data: [], 
        error: null,
        isSuccess: () => true,
        isError: () => false,
        getErrorMessage: () => ''
      });
    }),
    single: jest.fn().mockImplementation(function() {
      console.log('[Mock Repository] single called');
      return Promise.resolve({ 
        data: { id: 'test-id', name: 'Test Entity' }, 
        error: null,
        isSuccess: () => true,
        isError: () => false,
        getErrorMessage: () => ''
      });
    }),
    maybeSingle: jest.fn().mockImplementation(function() {
      console.log('[Mock Repository] maybeSingle called');
      return Promise.resolve({ 
        data: { id: 'test-id', name: 'Test Entity' }, 
        error: null,
        isSuccess: () => true,
        isError: () => false,
        getErrorMessage: () => ''
      });
    })
  };
  
  return {
    createRepository: jest.fn().mockReturnValue(mockRepository),
    createSupabaseRepository: jest.fn().mockReturnValue(mockRepository)
  };
});

describe('API Factory with Repository Integration', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    console.log('--- Starting new test ---');
  });

  test('should automatically create repository when not provided', () => {
    // Create factory without explicit repository
    createApiFactory({
      tableName: 'test_table'
    });
    
    // Verify repository was created
    expect(createRepository).toHaveBeenCalledWith('test_table');
  });
  
  test('should use provided repository instance', () => {
    // Create mock repository
    const mockRepository = {
      select: jest.fn(() => mockRepository),
      insert: jest.fn(() => mockRepository),
      update: jest.fn(() => mockRepository),
      delete: jest.fn(() => mockRepository),
      eq: jest.fn(() => mockRepository),
      execute: jest.fn().mockImplementation(function() {
        console.log('[Custom Mock Repository] execute called');
        return Promise.resolve({
          data: [],
          error: null,
          isSuccess: () => true,
          isError: () => false,
          getErrorMessage: () => ''
        });
      }),
      single: jest.fn().mockImplementation(function() {
        console.log('[Custom Mock Repository] single called');
        return Promise.resolve({
          data: {},
          error: null,
          isSuccess: () => true,
          isError: () => false,
          getErrorMessage: () => ''
        });
      }),
      maybeSingle: jest.fn().mockImplementation(function() {
        console.log('[Custom Mock Repository] maybeSingle called');
        return Promise.resolve({
          data: {},
          error: null,
          isSuccess: () => true,
          isError: () => false,
          getErrorMessage: () => ''
        });
      })
    } as unknown as DataRepository<any>;
    
    // Create factory with repository instance
    const factory = createApiFactory({
      tableName: 'test_table',
      repository: mockRepository
    });
    
    // Call method to verify repository is used
    factory.getAll();
    
    // Verify mock repository was used instead of creating a new one
    expect(createRepository).not.toHaveBeenCalled();
    expect(mockRepository.select).toHaveBeenCalled();
  });
  
  test('should use repository factory function when provided', () => {
    // Create mock repository
    const mockRepository = {
      select: jest.fn(() => mockRepository),
      insert: jest.fn(() => mockRepository),
      update: jest.fn(() => mockRepository),
      delete: jest.fn(() => mockRepository),
      eq: jest.fn(() => mockRepository),
      execute: jest.fn().mockResolvedValue({
        data: [],
        error: null,
        isSuccess: () => true,
        isError: () => false,
        getErrorMessage: () => ''
      }),
      single: jest.fn().mockResolvedValue({
        data: {},
        error: null,
        isSuccess: () => true,
        isError: () => false,
        getErrorMessage: () => ''
      }),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {},
        error: null,
        isSuccess: () => true,
        isError: () => false,
        getErrorMessage: () => ''
      })
    } as unknown as DataRepository<any>;
    
    const repositoryFactory = jest.fn().mockReturnValue(mockRepository);
    
    // Create factory with repository factory function
    const factory = createApiFactory({
      tableName: 'test_table',
      repository: repositoryFactory
    });
    
    // Call method to verify repository is used
    factory.getAll();
    
    // Verify factory was called and repository was used
    expect(repositoryFactory).toHaveBeenCalled();
    expect(mockRepository.select).toHaveBeenCalled();
    expect(createRepository).not.toHaveBeenCalled();
  });
  
  test('should handle repository error gracefully', async () => {
    // Mock repository that throws error
    const mockRepository = {
      select: jest.fn().mockImplementation(() => {
        console.log('[Error Mock Repository] Throwing error');
        throw new Error('Repository error');
      })
    } as unknown as DataRepository<any>;
    
    // Create factory with problematic repository
    const factory = createApiFactory({
      tableName: 'test_table',
      repository: mockRepository
    });
    
    // Call method that should handle the error
    const result = await factory.getAll();
    
    // Verify error was handled
    expect(result.status).toBe('error');
    expect(result.error?.message).toBe('Repository error');
  });
  
  test('should pass transformResponse to the repository methods', async () => {
    // Create transform function
    const transformResponse = jest.fn(item => ({
      ...item,
      transformed: true
    }));
    
    // Create factory with transformResponse
    const factory = createApiFactory({
      tableName: 'test_table',
      transformResponse
    });
    
    // Call method to test transform
    const result = await factory.getById('test-id');
    
    // Verify transform was applied to the result
    expect(result.status).toBe('success');
    expect(transformResponse).toHaveBeenCalled();
  });
  
  test('should use custom defaultSelect option with repository', async () => {
    // Create mock repository
    const mockRepository = {
      select: jest.fn(() => mockRepository),
      insert: jest.fn(() => mockRepository),
      update: jest.fn(() => mockRepository),
      delete: jest.fn(() => mockRepository),
      eq: jest.fn(() => mockRepository),
      execute: jest.fn().mockResolvedValue({
        data: [],
        error: null,
        isSuccess: () => true,
        isError: () => false,
        getErrorMessage: () => ''
      }),
      single: jest.fn().mockResolvedValue({
        data: {},
        error: null,
        isSuccess: () => true,
        isError: () => false,
        getErrorMessage: () => ''
      }),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {},
        error: null,
        isSuccess: () => true,
        isError: () => false,
        getErrorMessage: () => ''
      })
    } as unknown as DataRepository<any>;
    
    // Create factory with custom select and repository
    const factory = createApiFactory({
      tableName: 'test_table',
      repository: mockRepository,
      defaultSelect: 'id, name, custom_field'
    });
    
    // Call getAll to test if select is passed correctly
    await factory.getAll();
    
    // Verify custom select was used
    expect(mockRepository.select).toHaveBeenCalledWith('id, name, custom_field');
  });
  
  test('should support repository type option', () => {
    // Create factory specifying mock repository type
    const factory = createApiFactory({
      tableName: 'test_table',
      repository: { type: 'mock' }
    });
    
    // Verify createRepository was called with the correct type
    expect(createRepository).toHaveBeenCalledWith('test_table', 'mock', undefined);
    
    // Clear mocks for next test
    jest.clearAllMocks();
    
    // Create factory with initial data for mock repository
    const initialData = [{ id: '1', name: 'Test' }];
    createApiFactory({
      tableName: 'test_table',
      repository: { 
        type: 'mock',
        initialData
      }
    });
    
    // Verify createRepository was called with initial data
    expect(createRepository).toHaveBeenCalledWith('test_table', 'mock', initialData);
  });
});
