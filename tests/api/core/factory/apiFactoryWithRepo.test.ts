
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { createTestRepository } from '@/api/core/testing/repositoryTestUtils';
import { createMockDataGenerator } from '@/api/core/testing/mockDataGenerator';

// Define a test entity type
interface TestEntity {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

describe('API Factory with Repository', () => {
  // Create a data generator for TestEntity
  const testEntityGenerator = createMockDataGenerator<TestEntity>('custom', {
    name: () => `Test ${Math.floor(Math.random() * 1000)}`,
    description: () => `Description for test entity ${Math.floor(Math.random() * 1000)}`,
    created_at: () => new Date().toISOString(),
  });

  beforeEach(() => {
    // Add global console log spy to help debug test failures
    jest.spyOn(console, 'log');
    jest.spyOn(console, 'error');
    
    console.log('--- Starting new test ---');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('creates operations with repository', () => {
    const mockRepo = createTestRepository<TestEntity>({
      tableName: 'test_table',
      initialData: []
    });
    
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_table',
      repository: mockRepo
    });
    
    // Check basic structure
    expect(factory).toHaveProperty('getAll');
    expect(factory).toHaveProperty('getById');
    expect(factory).toHaveProperty('create');
    expect(factory).toHaveProperty('update');
    expect(factory).toHaveProperty('delete');
  });

  test('create adds new entity', async () => {
    // Create test repository with empty initial data
    const mockRepo = createTestRepository<TestEntity>({
      tableName: 'test_table',
      initialData: []
    });
    
    // Create API factory with mock repository
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_table',
      repository: mockRepo
    });
    
    // New entity data
    const newEntity = {
      name: 'New Entity',
      description: 'New Description'
    };
    
    // Call create
    const result = await factory.create(newEntity);
    
    // Log the result for debugging
    console.log(`create result: ${JSON.stringify(result)}`);
    
    // Verify result
    expect(result.status).toBe('success');
    expect(result.data?.name).toBe('New Entity');
    expect(result.data?.description).toBe('New Description');
    
    // Check it was added to repository
    const allEntities = await mockRepo.select().execute();
    expect(allEntities.data).toHaveLength(1);
    expect(allEntities.data?.[0].name).toBe('New Entity');
  });
  
  test('getById returns entity with matching ID', async () => {
    // Create test repository
    const mockRepo = createTestRepository<TestEntity>({
      tableName: 'test_table',
      initialData: []
    });

    // Create and add an entity using the repository
    const testEntity = {
      id: '1',
      name: 'Entity 1',
      description: 'Description 1',
      created_at: new Date().toISOString()
    };
    await mockRepo.insert(testEntity).execute();
    
    // Log to verify the data is in the repository
    console.log(`Test data in repository: ${JSON.stringify(mockRepo.mockData)}`);
    
    // Create API factory with mock repository
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_table',
      repository: mockRepo
    });
    
    // Call getById
    const result = await factory.getById('1');
    
    // Log the result for debugging
    console.log(`getById result: ${JSON.stringify(result)}`);
    
    // Verify results
    expect(result.status).toBe('success');
    expect(result.data).toBeDefined();
    expect(result.data?.id).toBe('1');
    expect(result.data?.name).toBe('Entity 1');
  });

  test('update modifies existing entity', async () => {
    // Create test repository
    const mockRepo = createTestRepository<TestEntity>({
      tableName: 'test_table',
      initialData: []
    });
    
    // Create and add an entity using the repository
    const testEntity = {
      id: '1',
      name: 'Entity 1',
      description: 'Original Description',
      created_at: new Date().toISOString()
    };
    await mockRepo.insert(testEntity).execute();
    
    // Log to verify the entity was added
    console.log(`Repository data before update: ${JSON.stringify(mockRepo.mockData)}`);
    
    // Create API factory with mock repository
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_table',
      repository: mockRepo
    });
    
    // Update data
    const updateData = {
      description: 'Updated Description'
    };
    
    // Call update
    const result = await factory.update('1', updateData);
    
    // Log the result and repository state for debugging
    console.log(`update result: ${JSON.stringify(result)}`);
    console.log(`Repository data after update: ${JSON.stringify(mockRepo.mockData)}`);
    
    // Verify result
    expect(result.status).toBe('success');
    expect(result.data?.name).toBe('Entity 1'); // Unchanged
    expect(result.data?.description).toBe('Updated Description'); // Updated
    
    // Check it was updated in repository
    const updatedEntity = await mockRepo.select().eq('id', '1').maybeSingle();
    expect(updatedEntity.data?.description).toBe('Updated Description');
  });
  
  test('getAll uses repository to fetch data', async () => {
    // Create test repository
    const mockRepo = createTestRepository<TestEntity>({
      tableName: 'test_table',
      initialData: []
    });
    
    // Create multiple entities
    const entity1 = {
      id: '1',
      name: 'Entity 1',
      description: 'Description 1',
      created_at: new Date().toISOString()
    };
    
    const entity2 = {
      id: '2',
      name: 'Entity 2',
      description: 'Description 2',
      created_at: new Date().toISOString()
    };
    
    // Add entities to repository
    await mockRepo.insert([entity1, entity2]).execute();

    // Log to verify the data is in the repository
    console.log(`Test data in repository: ${JSON.stringify(mockRepo.mockData)}`);
    
    // Create API factory with mock repository
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_table',
      repository: mockRepo
    });
    
    // Call getAll
    const result = await factory.getAll();
    
    // Log the result for debugging
    console.log(`getAll result: ${JSON.stringify(result)}`);
    
    // Verify results without depending on order
    expect(result.status).toBe('success');
    expect(result.data).toHaveLength(2);
    
    // Check that both entities are present by ID, not relying on specific order
    const resultIds = result.data!.map(entity => entity.id).sort();
    expect(resultIds).toEqual(['1', '2']);
  });
  
  test('applies correct filters in getAll', async () => {
    // Create test repository
    const mockRepo = createTestRepository<TestEntity>({
      tableName: 'test_table',
      initialData: []
    });
    
    // Create multiple entities with varied names
    const entity1 = {
      id: '1',
      name: 'AppleDevice',
      description: 'Description 1',
      created_at: new Date().toISOString()
    };
    
    const entity2 = {
      id: '2',
      name: 'SamsungDevice',
      description: 'Description 2',
      created_at: new Date().toISOString()
    };
    
    const entity3 = {
      id: '3',
      name: 'AppleComputer',
      description: 'Description 3',
      created_at: new Date().toISOString()
    };
    
    // Add entities to repository
    await mockRepo.insert([entity1, entity2, entity3]).execute();
    
    // Log to verify the data is in the repository
    console.log(`Test data in repository: ${JSON.stringify(mockRepo.mockData)}`);
    
    // Create API factory with mock repository
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_table',
      repository: mockRepo
    });
    
    // Call getAll with filters
    const result = await factory.getAll({ 
      filters: { name: 'AppleDevice' } 
    });
    
    // Log the result for debugging
    console.log(`getAll with filters result: ${JSON.stringify(result)}`);
    
    // Verify results
    expect(result.status).toBe('success');
    expect(result.data).toHaveLength(1);
    expect(result.data![0].id).toBe('1');
    expect(result.data![0].name).toBe('AppleDevice');
  });
  
  test('delete removes entity', async () => {
    // Create test repository
    const mockRepo = createTestRepository<TestEntity>({
      tableName: 'test_table',
      initialData: []
    });
    
    // Create multiple entities
    const entity1 = {
      id: '1',
      name: 'Entity 1',
      description: 'Description 1',
      created_at: new Date().toISOString()
    };
    
    const entity2 = {
      id: '2',
      name: 'Entity 2',
      description: 'Description 2',
      created_at: new Date().toISOString()
    };
    
    // Add entities to repository
    await mockRepo.insert([entity1, entity2]).execute();
    
    // Log to verify the data is in the repository before delete
    console.log(`Test data in repository before delete: ${JSON.stringify(mockRepo.mockData)}`);
    console.log(`Test data length before delete: ${mockRepo.mockData.length}`);
    
    // Create API factory with mock repository
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_table',
      repository: mockRepo
    });
    
    // Get all entities before delete to verify initial state
    const beforeDelete = await mockRepo.select().execute();
    console.log(`Entities before delete: ${JSON.stringify(beforeDelete.data)}`);
    expect(beforeDelete.data?.length).toBe(2);
    
    // Call delete
    const result = await factory.delete('1');
    
    // Log the result for debugging
    console.log(`delete result: ${JSON.stringify(result)}`);
    
    // Check repository state directly
    console.log(`Repository data after delete: ${JSON.stringify(mockRepo.mockData)}`);
    
    // Verify remaining data in the repository
    expect(mockRepo.mockData.length).toBe(1);
    expect(mockRepo.mockData[0].id).toBe('2');
    
    // Verify result
    expect(result.status).toBe('success');
    
    // Check using the API to verify data was removed
    const allEntities = await mockRepo.select().execute();
    console.log(`Remaining entities after delete: ${JSON.stringify(allEntities.data)}`);
    
    expect(allEntities.data).toHaveLength(1);
    expect(allEntities.data![0].id).toBe('2');
  });

  test('supports extended operations', async () => {
    // Create test repository
    const mockRepo = createTestRepository<TestEntity>({
      tableName: 'test_table',
      initialData: []
    });
    
    // Create API factory with extended operations
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_table',
      repository: mockRepo,
      useQueryOperations: true,
      useMutationOperations: true,
      useBatchOperations: true
    });
    
    // Check that extended operations are present
    expect(factory).toHaveProperty('getAll'); // Base operation
    expect(factory).toHaveProperty('getById'); // Base operation
    expect(factory).toHaveProperty('getByIds'); // Query operation
    expect(factory).toHaveProperty('batchCreate'); // Batch operation
    expect(factory).toHaveProperty('tableName'); // Additional property
  });
});
