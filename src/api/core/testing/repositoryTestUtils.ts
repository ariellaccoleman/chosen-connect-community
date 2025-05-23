
import { DataRepository } from '../repository/DataRepository';
import { createMockRepository } from '../repository/MockRepository';
import { BaseRepository } from '../repository/BaseRepository';
import { createMockDataGenerator, MockDataGenerator } from './mockDataGenerator';

/**
 * Enhanced mock repository with testing utilities
 */
export interface EnhancedMockRepository<T> extends BaseRepository<T> {
  /**
   * Original mock data array reference
   */
  mockData: T[];
  
  /**
   * Spies for repository methods
   */
  spies: Record<string, jest.SpyInstance<any> | null>;
  
  /**
   * Reset all spies on the mock repository
   */
  resetSpies: () => void;
  
  /**
   * Add items to the mock repository
   */
  addItems: (items: T | T[]) => void;
  
  /**
   * Clear all items from the repository
   */
  clearItems: () => void;
  
  /**
   * Find an item by ID
   */
  findById: (id: string) => T | undefined;
  
  /**
   * Update an item directly in the mock data
   */
  updateItem: (id: string, updates: Partial<T>) => T | undefined;
  
  /**
   * Mock a specific error response for an operation
   */
  mockError: (operation: string, code: string, message: string) => void;
  
  /**
   * Mock a specific success response for an operation
   */
  mockSuccess: (operation: string, data: any) => void;
  
  /**
   * Create snapshot of the current repository state
   */
  createSnapshot: () => T[];
}

/**
 * TestRepository configuration options
 */
export interface TestRepositoryOptions<T> {
  /**
   * Table name for the repository
   */
  tableName: string;
  
  /**
   * Initial data to populate the repository
   */
  initialData?: T[];
  
  /**
   * Entity type for generating mock data
   */
  entityType?: string;
  
  /**
   * Data generator to use for creating test data
   */
  dataGenerator?: MockDataGenerator<T>;
  
  /**
   * Name of the ID field (defaults to 'id')
   */
  idField?: string;
}

/**
 * Creates an enhanced test repository with additional testing utilities
 */
export function createTestRepository<T>(
  options: TestRepositoryOptions<T>
): EnhancedMockRepository<T> {
  const { 
    tableName, 
    initialData = [], 
    entityType,
    idField = 'id'
  } = options;
  
  // Create the base mock repository
  const mockRepo = createMockRepository<T>(tableName, initialData);
  
  // Create data generator if entity type is provided
  const dataGenerator = options.dataGenerator || 
    (entityType ? createMockDataGenerator<T>(entityType) : undefined);
  
  // Check if Jest is available and create spies if it is
  const hasJest = typeof jest !== 'undefined' && jest !== null;
  
  // Create spies for repository methods if jest is available
  const selectSpy = hasJest && typeof jest.spyOn === 'function' ? jest.spyOn(mockRepo, 'select') : null;
  const insertSpy = hasJest && typeof jest.spyOn === 'function' ? jest.spyOn(mockRepo, 'insert') : null;
  const updateSpy = hasJest && typeof jest.spyOn === 'function' ? jest.spyOn(mockRepo, 'update') : null;
  const deleteSpy = hasJest && typeof jest.spyOn === 'function' ? jest.spyOn(mockRepo, 'delete') : null;
  const getByIdSpy = hasJest && typeof jest.spyOn === 'function' ? jest.spyOn(mockRepo, 'getById') : null;
  const getAllSpy = hasJest && typeof jest.spyOn === 'function' ? jest.spyOn(mockRepo, 'getAll') : null;
  
  // Create an enhanced repository with test utilities
  const enhancedRepo = mockRepo as EnhancedMockRepository<T>;
  
  // Store original data reference for test manipulations
  enhancedRepo.mockData = initialData;
  
  // Setup spies for monitoring method calls
  enhancedRepo.spies = {
    select: selectSpy,
    insert: insertSpy,
    update: updateSpy,
    delete: deleteSpy,
    getById: getByIdSpy,
    getAll: getAllSpy
  };
  
  // Add test utility methods
  enhancedRepo.resetSpies = () => {
    Object.values(enhancedRepo.spies).forEach(spy => {
      if (spy && typeof spy.mockClear === 'function') {
        spy.mockClear();
      }
    });
  };
  
  // Method to add items to the mock data
  enhancedRepo.addItems = (items: T | T[]) => {
    if (Array.isArray(items)) {
      enhancedRepo.mockData.push(...items);
    } else {
      enhancedRepo.mockData.push(items);
    }
  };
  
  // Method to clear all items
  enhancedRepo.clearItems = () => {
    enhancedRepo.mockData.length = 0;
  };
  
  // Find an item by ID
  enhancedRepo.findById = (id: string) => {
    return enhancedRepo.mockData.find(item => 
      (item as any)[idField] === id
    );
  };
  
  // Update an item directly
  enhancedRepo.updateItem = (id: string, updates: Partial<T>) => {
    const index = enhancedRepo.mockData.findIndex(
      item => (item as any)[idField] === id
    );
    
    if (index === -1) return undefined;
    
    enhancedRepo.mockData[index] = { 
      ...enhancedRepo.mockData[index], 
      ...updates 
    };
    
    return enhancedRepo.mockData[index];
  };
  
  // Mock specific error responses
  enhancedRepo.mockError = (operation: string, code: string, message: string) => {
    (mockRepo as any).setMockResponse(operation, {
      data: null,
      error: { code, message },
      isSuccess: () => false,
      isError: () => true,
      getErrorMessage: () => message
    });
  };
  
  // Mock specific success responses
  enhancedRepo.mockSuccess = (operation: string, data: any) => {
    (mockRepo as any).setMockResponse(operation, {
      data,
      error: null,
      isSuccess: () => true,
      isError: () => false,
      getErrorMessage: () => ''
    });
  };
  
  // Create snapshot of current data
  enhancedRepo.createSnapshot = () => {
    return [...enhancedRepo.mockData];
  };
  
  /**
   * Generate test data utility, if data generator is available
   */
  if (dataGenerator) {
    (enhancedRepo as any).generateTestData = (count: number, overrides?: Partial<T>) => {
      const data = dataGenerator.generateMany(count, overrides);
      return data;
    };
    
    (enhancedRepo as any).generateAndAddTestData = (count: number, overrides?: Partial<T>) => {
      const data = dataGenerator.generateMany(count, overrides);
      enhancedRepo.addItems(data);
      return data;
    };
  }
  
  return enhancedRepo;
}

/**
 * Create a test context for easy setup and cleanup of repository tests
 */
export function createRepositoryTestContext<T>(
  options: TestRepositoryOptions<T>
) {
  let repository: EnhancedMockRepository<T>;
  
  const setup = () => {
    repository = createTestRepository<T>(options);
    return repository;
  };
  
  const cleanup = () => {
    if (repository) {
      repository.resetSpies();
      repository.clearItems();
    }
  };
  
  const generateData = (count: number, overrides?: Partial<T>) => {
    if (!options.dataGenerator && !options.entityType) {
      throw new Error('Cannot generate data without dataGenerator or entityType');
    }
    
    const generator = options.dataGenerator || createMockDataGenerator<T>(options.entityType!);
    return generator.generateMany(count, overrides);
  };
  
  return {
    setup,
    cleanup,
    generateData,
    get repository() {
      if (!repository) setup();
      return repository;
    }
  };
}

/**
 * Mock the repository factory to return test repositories
 */
export function mockRepositoryFactory(mockData: Record<string, any[]> = {}) {
  // Check if jest is available in the environment
  const hasJest = typeof jest !== 'undefined' && jest !== null;
  if (!hasJest) {
    console.warn('Jest is not available in the current environment. mockRepositoryFactory requires Jest.');
    return;
  }
  
  // Mock the createSupabaseRepository function
  jest.mock('../repository/repositoryFactory', () => ({
    createSupabaseRepository: jest.fn((tableName: string) => {
      return createTestRepository({
        tableName,
        initialData: mockData[tableName] || [],
        idField: 'id'
      });
    }),
    // Maintain other exports
    createRepository: jest.fn((tableName: string, type: string) => {
      if (type === 'mock') {
        return createTestRepository({
          tableName,
          initialData: mockData[tableName] || [],
          idField: 'id'
        });
      } else {
        return createTestRepository({
          tableName,
          initialData: mockData[tableName] || [],
          idField: 'id'
        });
      }
    }),
  }));
}

/**
 * Reset repository factory mocks
 */
export function resetRepositoryFactoryMock() {
  // Check if jest is available in the environment
  const hasJest = typeof jest !== 'undefined' && jest !== null;
  if (!hasJest) {
    console.warn('Jest is not available in the current environment. resetRepositoryFactoryMock requires Jest.');
    return;
  }
  
  jest.resetModules();
  jest.dontMock('../repository/repositoryFactory');
}
