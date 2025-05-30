
import { BaseRepository } from '../repository/BaseRepository';
import { createTestingRepository } from '../repository/repositoryFactory';
import { createMockDataGenerator, MockDataGenerator } from './mockDataGenerator';

/**
 * Enhanced test repository with testing utilities for schema-based testing
 */
export interface EnhancedTestRepository<T> extends BaseRepository<T> {
  /**
   * Reset the repository to a clean state
   */
  reset: () => Promise<void>;
  
  /**
   * Add items to the repository
   */
  addItems: (items: T | T[]) => Promise<T[]>;
  
  /**
   * Clear all items from the repository
   */
  clearItems: () => Promise<void>;
  
  /**
   * Find an item by ID
   */
  findById: (id: string) => Promise<T | null>;
  
  /**
   * Create snapshot of the current repository state
   */
  createSnapshot: () => Promise<T[]>;
}

/**
 * TestRepository configuration options for schema-based testing
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
   * Entity type for generating test data
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
  
  /**
   * Enable debug logging
   */
  debug?: boolean;
  
  /**
   * Schema name for database operations (defaults to 'testing')
   */
  schema?: string;
  
  /**
   * Client to use for database operations
   */
  client?: any;
}

/**
 * Creates an enhanced test repository using schema-based testing
 */
export function createTestRepository<T>(
  options: TestRepositoryOptions<T>
): EnhancedTestRepository<T> {
  const { 
    tableName, 
    initialData = [], 
    entityType,
    idField = 'id',
    debug = true,
    schema = 'testing',
    client
  } = options;
  
  if (debug) {
    console.log(`[createTestRepository] Creating schema-based repository for ${tableName}`);
    console.log(`[createTestRepository] Using schema: ${schema}`);
  }
  
  // Create the base testing repository using schema-based approach
  const baseRepo = createTestingRepository<T>(tableName, { 
    schema,
    enableLogging: debug,
    client
  }, client);
  
  // Create data generator if entity type is provided
  const dataGenerator = options.dataGenerator || 
    (entityType ? createMockDataGenerator<T>(entityType) : undefined);
  
  // Create an enhanced repository with test utilities
  const enhancedRepo = baseRepo as EnhancedTestRepository<T>;
  
  // Add test utility methods
  enhancedRepo.reset = async () => {
    if (debug) console.log(`[${tableName}] Resetting repository`);
    
    // Clear all data from the table
    await baseRepo.delete().execute();
    
    // Re-insert initial data if provided
    if (initialData.length > 0) {
      await baseRepo.insert(initialData).execute();
    }
    
    if (debug) console.log(`[${tableName}] Repository reset complete`);
  };
  
  // Method to add items to the repository
  enhancedRepo.addItems = async (items: T | T[]) => {
    if (debug) console.log(`[${tableName}] Adding items to repository`);
    
    const itemsArray = Array.isArray(items) ? items : [items];
    const result = await baseRepo.insert(itemsArray).execute();
    
    if (result.isError()) {
      throw new Error(`Failed to add items: ${result.getErrorMessage()}`);
    }
    
    const addedItems = Array.isArray(result.data) ? result.data : [result.data];
    if (debug) console.log(`[${tableName}] Added ${addedItems.length} items`);
    
    return addedItems;
  };
  
  // Method to clear all items
  enhancedRepo.clearItems = async () => {
    if (debug) console.log(`[${tableName}] Clearing all items from repository`);
    
    const result = await baseRepo.delete().execute();
    
    if (result.isError()) {
      throw new Error(`Failed to clear items: ${result.getErrorMessage()}`);
    }
    
    if (debug) console.log(`[${tableName}] All items cleared`);
  };
  
  // Find an item by ID
  enhancedRepo.findById = async (id: string) => {
    if (debug) console.log(`[${tableName}] Finding item by ID: ${id}`);
    
    const result = await baseRepo.select().eq(idField, id).maybeSingle();
    
    if (result.isError()) {
      if (debug) console.log(`[${tableName}] Error finding item: ${result.getErrorMessage()}`);
      return null;
    }
    
    if (debug) {
      if (result.data) console.log(`[${tableName}] Found item: ${JSON.stringify(result.data)}`);
      else console.log(`[${tableName}] No item found with ID: ${id}`);
    }
    
    return result.data;
  };
  
  // Create snapshot of current data
  enhancedRepo.createSnapshot = async () => {
    if (debug) console.log(`[${tableName}] Creating snapshot of repository data`);
    
    const result = await baseRepo.select().execute();
    
    if (result.isError()) {
      throw new Error(`Failed to create snapshot: ${result.getErrorMessage()}`);
    }
    
    const data = result.data || [];
    if (debug) console.log(`[${tableName}] Snapshot created with ${data.length} items`);
    
    return data;
  };
  
  /**
   * Generate test data utility, if data generator is available
   */
  if (dataGenerator) {
    (enhancedRepo as any).generateTestData = (count: number, overrides?: Partial<T>) => {
      if (debug) console.log(`[${tableName}] Generating ${count} test items`);
      const data = dataGenerator.generateMany(count, overrides);
      return data;
    };
    
    (enhancedRepo as any).generateAndAddTestData = async (count: number, overrides?: Partial<T>) => {
      if (debug) console.log(`[${tableName}] Generating and adding ${count} test items`);
      const data = dataGenerator.generateMany(count, overrides);
      return await enhancedRepo.addItems(data);
    };
  }
  
  // Initialize with initial data if provided
  if (initialData.length > 0) {
    // We'll add the initial data in the setup phase
    (enhancedRepo as any).initialData = initialData;
  }
  
  return enhancedRepo;
}

/**
 * Create a test context for easy setup and cleanup of schema-based repository tests
 */
export function createRepositoryTestContext<T>(
  options: TestRepositoryOptions<T>
) {
  let repository: EnhancedTestRepository<T>;
  
  const setup = async () => {
    repository = createTestRepository<T>(options);
    
    // Initialize with initial data if provided
    if (options.initialData && options.initialData.length > 0) {
      await repository.addItems(options.initialData);
    }
    
    return repository;
  };
  
  const cleanup = async () => {
    if (repository) {
      await repository.clearItems();
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
      if (!repository) {
        throw new Error('Repository not initialized. Call setup() first.');
      }
      return repository;
    }
  };
}

/**
 * Reset repository factory mocks - no longer needed with schema-based testing
 * @deprecated Use schema-based testing instead
 */
export function resetRepositoryFactoryMock() {
  console.warn('resetRepositoryFactoryMock is deprecated. Use schema-based testing instead.');
}
