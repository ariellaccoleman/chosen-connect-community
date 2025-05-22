
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
  // Create the mock repository with initial data
  const mockRepo = createMockRepository<T>(tableName, initialData);
  
  // Store the mock data for test assertions
  const mockData = initialData.slice();

  // Create spies for repository methods
  const selectSpy = jest.spyOn(mockRepo, 'select');
  const insertSpy = jest.spyOn(mockRepo, 'insert');
  const updateSpy = jest.spyOn(mockRepo, 'update');
  const deleteSpy = jest.spyOn(mockRepo, 'delete');
  
  // Create a enhanced repository with spies for monitoring
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
  
  return enhancedRepo;
}

/**
 * Mock the repository factory to return a test mock repository
 */
export function mockRepositoryFactory(mockData: Record<string, any[]> = {}) {
  // Mock the createSupabaseRepository function
  jest.mock('@/api/core/repository/repositoryFactory', () => ({
    createSupabaseRepository: jest.fn((tableName: string) => {
      return createMockRepository(tableName, mockData[tableName] || []);
    })
  }));
}

/**
 * Reset repository factory mocks
 */
export function resetRepositoryFactoryMock() {
  jest.resetModules();
  jest.dontMock('@/api/core/repository/repositoryFactory');
}
