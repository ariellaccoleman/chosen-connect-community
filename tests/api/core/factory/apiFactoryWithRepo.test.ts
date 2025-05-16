
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { createMockRepository } from '@/api/core/repository/MockRepository';

// Define a test entity type
interface TestEntity {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

describe('API Factory with Repository', () => {
  test('creates operations with repository', () => {
    const mockRepo = createMockRepository<TestEntity>('test_table');
    
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_table' as any,
      repository: mockRepo
    });
    
    // Check basic structure
    expect(factory).toHaveProperty('getAll');
    expect(factory).toHaveProperty('getById');
    expect(factory).toHaveProperty('create');
    expect(factory).toHaveProperty('update');
    expect(factory).toHaveProperty('delete');
  });
  
  test('getAll uses repository to fetch data', async () => {
    // Test data
    const testData: TestEntity[] = [
      { id: '1', name: 'Entity 1', description: 'Description 1', created_at: new Date().toISOString() },
      { id: '2', name: 'Entity 2', description: 'Description 2', created_at: new Date().toISOString() }
    ];
    
    // Create mock repository with initial data
    const mockRepo = createMockRepository<TestEntity>('test_table', testData);
    
    // Create API factory with mock repository
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_table' as any,
      repository: mockRepo
    });
    
    // Call getAll
    const result = await factory.getAll();
    
    // Verify
    expect(result.status).toBe('success');
    expect(result.data).toHaveLength(2);
    expect(result.data![0].name).toBe('Entity 1');
  });
  
  test('getById returns entity with matching ID', async () => {
    // Test data
    const testData: TestEntity[] = [
      { id: '1', name: 'Entity 1', description: 'Description 1', created_at: new Date().toISOString() },
      { id: '2', name: 'Entity 2', description: 'Description 2', created_at: new Date().toISOString() }
    ];
    
    // Create mock repository with initial data
    const mockRepo = createMockRepository<TestEntity>('test_table', testData);
    
    // Create API factory with mock repository
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_table' as any,
      repository: mockRepo
    });
    
    // Call getById
    const result = await factory.getById('2');
    
    // Verify
    expect(result.status).toBe('success');
    expect(result.data?.id).toBe('2');
    expect(result.data?.name).toBe('Entity 2');
  });
  
  test('create adds new entity', async () => {
    // Create mock repository
    const mockRepo = createMockRepository<TestEntity>('test_table');
    
    // Create API factory with mock repository
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_table' as any,
      repository: mockRepo
    });
    
    // New entity data
    const newEntity = {
      name: 'New Entity',
      description: 'New Description'
    };
    
    // Call create
    const result = await factory.create(newEntity);
    
    // Verify
    expect(result.status).toBe('success');
    expect(result.data?.name).toBe('New Entity');
    expect(result.data?.description).toBe('New Description');
    
    // Check it was added to repository
    const allEntities = await mockRepo.select().execute();
    expect(allEntities.data).toHaveLength(1);
  });
  
  test('update modifies existing entity', async () => {
    // Test data
    const testData: TestEntity[] = [
      { id: '1', name: 'Entity 1', description: 'Original Description', created_at: new Date().toISOString() }
    ];
    
    // Create mock repository with initial data
    const mockRepo = createMockRepository<TestEntity>('test_table', testData);
    
    // Create API factory with mock repository
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_table' as any,
      repository: mockRepo
    });
    
    // Update data
    const updateData = {
      description: 'Updated Description'
    };
    
    // Call update
    const result = await factory.update('1', updateData);
    
    // Verify
    expect(result.status).toBe('success');
    expect(result.data?.name).toBe('Entity 1'); // Unchanged
    expect(result.data?.description).toBe('Updated Description'); // Updated
    
    // Check it was updated in repository
    const entity = await mockRepo.select().eq('id', '1').single();
    expect(entity.data?.description).toBe('Updated Description');
  });
  
  test('delete removes entity', async () => {
    // Test data
    const testData: TestEntity[] = [
      { id: '1', name: 'Entity 1', description: 'Description 1', created_at: new Date().toISOString() },
      { id: '2', name: 'Entity 2', description: 'Description 2', created_at: new Date().toISOString() }
    ];
    
    // Create mock repository with initial data
    const mockRepo = createMockRepository<TestEntity>('test_table', testData);
    
    // Create API factory with mock repository
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_table' as any,
      repository: mockRepo
    });
    
    // Call delete
    const result = await factory.delete('1');
    
    // Verify
    expect(result.status).toBe('success');
    expect(result.data).toBe(true);
    
    // Check it was removed from repository
    const allEntities = await mockRepo.select().execute();
    expect(allEntities.data).toHaveLength(1);
    expect(allEntities.data![0].id).toBe('2');
  });
  
  test('applies correct filters in getAll', async () => {
    // Test data with varied names
    const testData: TestEntity[] = [
      { id: '1', name: 'AppleDevice', description: 'Description 1', created_at: new Date().toISOString() },
      { id: '2', name: 'SamsungDevice', description: 'Description 2', created_at: new Date().toISOString() },
      { id: '3', name: 'AppleComputer', description: 'Description 3', created_at: new Date().toISOString() }
    ];
    
    // Create mock repository with initial data
    const mockRepo = createMockRepository<TestEntity>('test_table', testData);
    
    // Create API factory with mock repository
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_table' as any,
      repository: mockRepo
    });
    
    // Call getAll with filters
    const result = await factory.getAll({ 
      filters: { name: 'AppleDevice' } 
    });
    
    // Verify
    expect(result.status).toBe('success');
    expect(result.data).toHaveLength(1);
    expect(result.data![0].id).toBe('1');
  });
  
  test('supports extended operations', async () => {
    // Create mock repository
    const mockRepo = createMockRepository<TestEntity>('test_table');
    
    // Create API factory with extended operations
    const factory = createApiFactory<TestEntity>({
      tableName: 'test_table' as any,
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
