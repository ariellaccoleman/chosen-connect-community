
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { createRepository } from '@/api/core/repository/repositoryFactory';
import { DataRepository } from '@/api/core/repository/DataRepository';

// Mock the repository factory
jest.mock('@/api/core/repository/repositoryFactory', () => {
  const mockRepository = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ data: [], error: null }),
    single: jest.fn().mockResolvedValue({ 
      data: { id: 'test-id', name: 'Test Entity' }, 
      error: null 
    }),
    maybeSingle: jest.fn().mockResolvedValue({ 
      data: { id: 'test-id', name: 'Test Entity' }, 
      error: null 
    })
  };
  
  return {
    createRepository: jest.fn().mockReturnValue(mockRepository),
    DataRepository: jest.requireActual('@/api/core/repository/DataRepository').DataRepository
  };
});

describe('API Factory with Repository Integration', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
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
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ data: [], error: null }),
      single: jest.fn().mockResolvedValue({ data: {}, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: {}, error: null })
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
    // Create mock repository factory
    const mockRepository = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ data: [], error: null }),
      single: jest.fn().mockResolvedValue({ data: {}, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: {}, error: null })
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
});
