
import { DataRepository } from '@/api/core/repository/DataRepository';
import { createMockRepository } from '@/api/core/repository/MockRepository';

/**
 * Creates a consistent mock repository for testing
 * 
 * @param tableName Name of the table
 * @param initialData Initial data to populate the mock repository
 * @returns A mock repository instance with additional spies for monitoring
 */
export function createTestMockRepository<T>(tableName: string, initialData: T[] = []): DataRepository<T> & { 
  mockData: T[],
  spies: Record<string, jest.SpyInstance>
} {
  console.log(`[createTestMockRepository] Creating test repository for ${tableName} with ${initialData.length} items`);
  
  // Deep clone initial data to prevent modifications affecting the source
  const clonedData = JSON.parse(JSON.stringify(initialData));
  
  // Create the mock repository with initial data
  const mockRepo = createMockRepository<T>(tableName, clonedData);
  
  // Store the mock data for test assertions
  const mockData = clonedData;

  // Create spies for repository methods
  const selectSpy = jest.spyOn(mockRepo, 'select');
  const insertSpy = jest.spyOn(mockRepo, 'insert');
  const updateSpy = jest.spyOn(mockRepo, 'update');
  const deleteSpy = jest.spyOn(mockRepo, 'delete');
  
  // Create an enhanced repository with spies for monitoring
  const enhancedRepo = mockRepo as DataRepository<T> & { 
    mockData: T[],
    spies: Record<string, jest.SpyInstance>
  };
  
  enhancedRepo.mockData = mockData;
  enhancedRepo.spies = {
    select: selectSpy,
    insert: insertSpy,
    update: updateSpy,
    delete: deleteSpy
  };
  
  console.log(`[createTestMockRepository] Test repository created for ${tableName}`);
  // Log mock data for debugging
  if (initialData.length > 0) {
    console.log(`[createTestMockRepository] First item: ${JSON.stringify(initialData[0])}`);
  }
  
  return enhancedRepo;
}

/**
 * Mock the repository factory to return a test mock repository
 * 
 * @param mockData Optional mock data keyed by table name
 */
export function mockRepositoryFactory(mockData: Record<string, any[]> = {}) {
  console.log(`[mockRepositoryFactory] Mocking repository factory with data for tables: ${Object.keys(mockData).join(', ')}`);
  
  // Mock the createSupabaseRepository function
  jest.mock('@/api/core/repository/repositoryFactory', () => {
    const factories = {
      createSupabaseRepository: jest.fn((tableName: string) => {
        console.log(`[Mock Factory] Creating repository for ${tableName}`);
        const repo = createMockRepository(tableName, mockData[tableName] || []);
        // Log the mock data for debugging
        if (mockData[tableName]?.length > 0) {
          console.log(`[Mock Factory] First item in ${tableName}: ${JSON.stringify(mockData[tableName][0])}`);
        }
        return repo;
      }),
      createRepository: jest.fn((tableName: string, type?: string, initialData?: any[]) => {
        console.log(`[Mock Factory] Creating ${type || 'default'} repository for ${tableName}`);
        const data = initialData || mockData[tableName] || [];
        const repo = createMockRepository(tableName, data);
        if (data.length > 0) {
          console.log(`[Mock Factory] First item in ${tableName}: ${JSON.stringify(data[0])}`);
        }
        return repo;
      })
    };
    
    return factories;
  });
}

/**
 * Reset repository factory mocks
 */
export function resetRepositoryFactoryMock() {
  console.log('[resetRepositoryFactoryMock] Resetting repository factory mocks');
  jest.resetModules();
  jest.dontMock('@/api/core/repository/repositoryFactory');
}
