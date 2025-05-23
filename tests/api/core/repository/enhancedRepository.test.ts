
import { createEnhancedRepository } from '@/api/core/repository/enhancedRepositoryFactory';
import { createTestRepository } from '@/api/core/testing/repositoryTestUtils';
import { createMockDataGenerator } from '@/api/core/testing/mockDataGenerator';
import { BaseRepository } from '@/api/core/repository/BaseRepository';
import { EntityType } from '@/types/entityTypes';
import { createApiFactory } from '@/api/core/factory/apiFactory';

// Define a test entity type
interface TestEntity {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at?: string;
}

describe('Enhanced Repository', () => {
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

  describe('Creation and Configuration', () => {
    test('creates a mock repository with default options', () => {
      const repo = createEnhancedRepository<TestEntity>(
        'test_table',
        'mock'
      );
      
      expect(repo).toBeDefined();
      expect(repo.tableName).toBe('test_table');
    });
    
    test('creates a repository with initial data', () => {
      const initialData = [
        { 
          id: '1', 
          name: 'Test 1', 
          description: 'Description 1', 
          created_at: new Date().toISOString() 
        }
      ];
      
      const repo = createEnhancedRepository<TestEntity>(
        'test_table',
        'mock',
        initialData
      );
      
      // Verify initial data was loaded
      repo.getAll().then(items => {
        expect(items).toHaveLength(1);
        expect(items[0].name).toBe('Test 1');
      });
    });
    
    test('configures repository with custom options', () => {
      const repo = createEnhancedRepository<TestEntity>(
        'test_table',
        'mock',
        [],
        {
          idField: 'custom_id',
          enableLogging: true,
          softDelete: true,
          deletedAtColumn: 'removed_at'
        }
      );
      
      expect(repo).toBeDefined();
      // Options are applied internally and should affect behavior
      // We'll test options through behavior in other tests
    });
  });

  describe('Basic Operations', () => {
    let repository: BaseRepository<TestEntity>;
    
    // IMPORTANT CHANGE: Use createTestRepository instead of createEnhancedRepository
    // This ensures we're using the same repository implementation as in the API tests
    beforeEach(() => {
      repository = createTestRepository<TestEntity>({
        tableName: 'test_table',
        initialData: []
      });
    });
    
    test('inserts and retrieves entities', async () => {
      // Insert test entity
      const testEntity = {
        name: 'New Entity',
        description: 'Test Description'
      };
      
      const insertResult = await repository.insert(testEntity).execute();
      expect(insertResult.isSuccess()).toBe(true);
      expect(insertResult.data?.name).toBe('New Entity');
      
      // Entity should have an ID
      const id = insertResult.data?.id;
      expect(id).toBeDefined();
      
      // Retrieve by ID
      const getResult = await repository.select().eq('id', id).maybeSingle();
      expect(getResult.isSuccess()).toBe(true);
      expect(getResult.data?.name).toBe('New Entity');
    });
    
    test('updates entities', async () => {
      // Insert test entity
      const insertResult = await repository.insert({
        name: 'Original Name',
        description: 'Original Description',
        created_at: new Date().toISOString()
      }).execute();
      
      const id = insertResult.data?.id;
      
      // Update entity
      const updateResult = await repository.update({
        description: 'Updated Description'
      }).eq('id', id).execute();
      
      expect(updateResult.isSuccess()).toBe(true);
      
      // Verify update
      const getResult = await repository.select().eq('id', id).maybeSingle();
      expect(getResult.data?.description).toBe('Updated Description');
      expect(getResult.data?.name).toBe('Original Name'); // Unchanged
    });
    
    test('deletes entities', async () => {
      // Insert test entity
      const insertResult = await repository.insert({
        name: 'To Be Deleted',
        description: 'This will be deleted',
        created_at: new Date().toISOString()
      }).execute();
      
      const id = insertResult.data?.id;
      
      // Get all before delete
      const beforeDelete = await repository.select().execute();
      const countBefore = beforeDelete.data?.length || 0;
      
      // Log the state before delete for debugging
      console.log(`Repository data before delete: ${JSON.stringify((repository as any).mockData)}`);
      
      // Delete entity
      const deleteResult = await repository.delete().eq('id', id).execute();
      expect(deleteResult.isSuccess()).toBe(true);
      
      // Log the state after delete for debugging
      console.log(`Repository data after delete: ${JSON.stringify((repository as any).mockData)}`);
      
      // Verify deletion
      const afterDelete = await repository.select().execute();
      expect(afterDelete.data?.length).toBe(countBefore - 1);
      
      // Verify specific entity is gone
      const getResult = await repository.select().eq('id', id).maybeSingle();
      expect(getResult.data).toBeNull();
    });
  });

  describe('Query Operations', () => {
    let repository: BaseRepository<TestEntity>;
    
    // IMPORTANT CHANGE: Use createTestRepository for consistency
    beforeEach(async () => {
      repository = createTestRepository<TestEntity>({
        tableName: 'test_table',
        initialData: []
      });
      
      // Add test data
      const testData = [
        {
          id: '1',
          name: 'Apple Product',
          description: 'Fruit device',
          created_at: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'Banana Product',
          description: 'Yellow device',
          created_at: '2025-02-01T00:00:00Z'
        },
        {
          id: '3',
          name: 'Apple Computer',
          description: 'Computing device',
          created_at: '2025-03-01T00:00:00Z'
        }
      ];
      
      await repository.insert(testData).execute();
    });
    
    test('filters with eq operator', async () => {
      const result = await repository.select()
        .eq('name', 'Apple Product')
        .execute();
      
      expect(result.data).toHaveLength(1);
      expect(result.data![0].id).toBe('1');
    });
    
    test('filters with ilike operator', async () => {
      const result = await repository.select()
        .ilike('name', '%Apple%')
        .execute();
      
      expect(result.data).toHaveLength(2);
      expect(result.data!.map(i => i.id).sort()).toEqual(['1', '3']);
    });
    
    test('filters with in operator', async () => {
      const result = await repository.select()
        .in('id', ['1', '3'])
        .execute();
      
      expect(result.data).toHaveLength(2);
      expect(result.data!.map(i => i.id).sort()).toEqual(['1', '3']);
    });
    
    test('orders results', async () => {
      const result = await repository.select()
        .order('created_at', { ascending: false })
        .execute();
      
      expect(result.data).toHaveLength(3);
      expect(result.data![0].id).toBe('3'); // Most recent first
    });
    
    test('limits results', async () => {
      const result = await repository.select()
        .limit(2)
        .execute();
      
      expect(result.data).toHaveLength(2);
    });
  });

  describe('Integration with API Factory', () => {
    let repository: BaseRepository<TestEntity>;
    let api: any;
    
    beforeEach(async () => {
      // Create a test repository using repositoryTestUtils to ensure consistency
      repository = createTestRepository<TestEntity>({
        tableName: 'test_table',
        initialData: []
      });
      
      // Create API factory using the repository
      api = createApiFactory<TestEntity>({
        tableName: 'test_table',
        repository
      });
      
      // Add test data through the repository
      const testEntity = {
        id: '1',
        name: 'Test Entity',
        description: 'Test Description',
        created_at: new Date().toISOString()
      };
      
      await repository.insert(testEntity).execute();
    });
    
    test('getById returns correct entity', async () => {
      const result = await api.getById('1');
      
      expect(result.status).toBe('success');
      expect(result.data?.id).toBe('1');
      expect(result.data?.name).toBe('Test Entity');
    });
    
    test('getAll returns all entities', async () => {
      const result = await api.getAll();
      
      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(1);
    });
    
    test('create adds new entity', async () => {
      const newEntity = {
        name: 'New API Entity',
        description: 'Created through API'
      };
      
      const result = await api.create(newEntity);
      
      expect(result.status).toBe('success');
      expect(result.data?.name).toBe('New API Entity');
      
      // Verify it was added to repository
      const allEntities = await repository.select().execute();
      expect(allEntities.data).toHaveLength(2);
    });
    
    test('update modifies existing entity', async () => {
      const updateData = {
        description: 'Updated through API'
      };
      
      const result = await api.update('1', updateData);
      
      expect(result.status).toBe('success');
      expect(result.data?.description).toBe('Updated through API');
      
      // Verify changes in repository
      const entity = await repository.select().eq('id', '1').maybeSingle();
      expect(entity.data?.description).toBe('Updated through API');
    });
    
    test('delete removes entity', async () => {
      // Verify entity exists before delete
      const beforeDelete = await repository.select().execute();
      console.log(`Before delete: ${JSON.stringify(beforeDelete.data)}`);
      expect(beforeDelete.data?.length).toBe(1);
      
      // Delete through API
      const result = await api.delete('1');
      
      expect(result.status).toBe('success');
      
      // Verify it's deleted from repository
      const afterDelete = await repository.select().execute();
      console.log(`After delete: ${JSON.stringify(afterDelete.data)}`);
      expect(afterDelete.data?.length).toBe(0);
    });
  });
});
