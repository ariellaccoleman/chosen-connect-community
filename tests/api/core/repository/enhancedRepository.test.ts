
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
    // IMPORTANT CHANGE: Use createTestRepository consistently for all basic operation tests
    // This ensures we have proper access to mockData and consistent behavior
    let repository: any; 
    
    beforeEach(() => {
      // Use createTestRepository like in API tests for consistent behavior
      repository = createTestRepository<TestEntity>({
        tableName: 'test_table',
        initialData: [],
        debug: true 
      });
      
      // Log the repository structure for debugging
      console.log('Repository created with structure:', 
        JSON.stringify({
          type: typeof repository,
          hasData: Array.isArray(repository.mockData),
          dataLength: repository.mockData ? repository.mockData.length : 'N/A',
          hasMethods: {
            insert: typeof repository.insert === 'function',
            select: typeof repository.select === 'function',
            update: typeof repository.update === 'function',
            delete: typeof repository.delete === 'function',
          }
        })
      );
    });
    
    test('inserts and retrieves entities', async () => {
      // Insert test entity
      const testEntity = {
        name: 'New Entity',
        description: 'Test Description'
      };
      
      const insertResult = await repository.insert(testEntity).execute();
      console.log('Insert result:', JSON.stringify(insertResult));
      console.log('Repository after insert:', JSON.stringify(repository.mockData));
      console.log('Repository mockData length:', repository.mockData.length);
      
      expect(insertResult.isSuccess()).toBe(true);
      expect(insertResult.data?.name).toBe('New Entity');
      
      // Verify direct access to mockData
      expect(repository.mockData.length).toBe(1);
      
      // Entity should have an ID
      const id = insertResult.data?.id;
      expect(id).toBeDefined();
      
      // Retrieve by ID
      const getResult = await repository.select().eq('id', id).maybeSingle();
      console.log('Get result:', JSON.stringify(getResult));
      
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
      
      console.log('Insert result for update test:', JSON.stringify(insertResult));
      console.log('Repository after insert for update test:', JSON.stringify(repository.mockData));
      console.log('Repository mockData length:', repository.mockData.length);
      
      // Verify direct access to mockData
      expect(repository.mockData.length).toBe(1);
      
      const id = insertResult.data?.id;
      expect(id).toBeDefined();
      
      // Update entity
      const updateResult = await repository.update({
        description: 'Updated Description'
      }).eq('id', id).execute();
      
      console.log('Update result:', JSON.stringify(updateResult));
      console.log('Repository after update:', JSON.stringify(repository.mockData));
      
      expect(updateResult.isSuccess()).toBe(true);
      
      // Verify update
      const getResult = await repository.select().eq('id', id).maybeSingle();
      console.log('Get result after update:', JSON.stringify(getResult));
      
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
      expect(id).toBeDefined();
      
      // Verify entity exists before delete
      console.log(`Repository mockData before delete - length:`, repository.mockData.length);
      expect(repository.mockData.length).toBe(1);
      console.log(`Repository data before delete:`, JSON.stringify(repository.mockData));
      
      // Get all before delete to verify count
      const beforeDelete = await repository.select().execute();
      const countBefore = beforeDelete.data?.length || 0;
      console.log(`Select result before delete - count:`, countBefore);
      expect(countBefore).toBe(1);
      
      // Delete entity
      const deleteResult = await repository.delete().eq('id', id).execute();
      console.log('Delete result:', JSON.stringify(deleteResult));
      console.log(`Repository data after delete:`, JSON.stringify(repository.mockData));
      console.log(`Repository mockData after delete - length:`, repository.mockData.length);
      
      expect(deleteResult.isSuccess()).toBe(true);
      
      // Direct check on mockData - CRITICAL TEST
      expect(repository.mockData.length).toBe(0);
      
      // Verify deletion through repository select
      const afterDelete = await repository.select().execute();
      console.log(`Select result after delete:`, JSON.stringify(afterDelete));
      expect(afterDelete.data?.length).toBe(0);
      
      // Verify specific entity is gone
      const getResult = await repository.select().eq('id', id).maybeSingle();
      expect(getResult.data).toBeNull();
    });
  });

  describe('Query Operations', () => {
    let repository: any; // Changed to 'any' to access mockData directly
    
    // Use createTestRepository for consistency
    beforeEach(async () => {
      repository = createTestRepository<TestEntity>({
        tableName: 'test_table',
        initialData: [],
        debug: true
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
      console.log('Query test data after insert:', JSON.stringify(repository.mockData));
    });
    
    test('filters with eq operator', async () => {
      const result = await repository.select()
        .eq('name', 'Apple Product')
        .execute();
      
      console.log('Eq filter result:', JSON.stringify(result));
      
      expect(result.data).toHaveLength(1);
      expect(result.data![0].id).toBe('1');
    });
    
    test('filters with ilike operator', async () => {
      const result = await repository.select()
        .ilike('name', '%Apple%')
        .execute();
      
      console.log('Ilike filter result:', JSON.stringify(result));
      
      expect(result.data).toHaveLength(2);
      expect(result.data!.map(i => i.id).sort()).toEqual(['1', '3']);
    });
    
    test('filters with in operator', async () => {
      const result = await repository.select()
        .in('id', ['1', '3'])
        .execute();
      
      console.log('In filter result:', JSON.stringify(result));
      
      expect(result.data).toHaveLength(2);
      expect(result.data!.map(i => i.id).sort()).toEqual(['1', '3']);
    });
    
    test('orders results', async () => {
      const result = await repository.select()
        .order('created_at', { ascending: false })
        .execute();
      
      console.log('Order result:', JSON.stringify(result));
      
      expect(result.data).toHaveLength(3);
      expect(result.data![0].id).toBe('3'); // Most recent first
    });
    
    test('limits results', async () => {
      const result = await repository.select()
        .limit(2)
        .execute();
      
      console.log('Limit result:', JSON.stringify(result));
      
      expect(result.data).toHaveLength(2);
    });
  });

  describe('Integration with API Factory', () => {
    let repository: any; // Changed to 'any' to access mockData directly
    let api: any;
    
    beforeEach(async () => {
      // Create a test repository using repositoryTestUtils to ensure consistency
      repository = createTestRepository<TestEntity>({
        tableName: 'test_table',
        initialData: [],
        debug: true
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
      console.log('API test data after insert:', JSON.stringify(repository.mockData));
    });
    
    test('getById returns correct entity', async () => {
      const result = await api.getById('1');
      
      console.log('API getById result:', JSON.stringify(result));
      
      expect(result.status).toBe('success');
      expect(result.data?.id).toBe('1');
      expect(result.data?.name).toBe('Test Entity');
    });
    
    test('getAll returns all entities', async () => {
      const result = await api.getAll();
      
      console.log('API getAll result:', JSON.stringify(result));
      
      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(1);
    });
    
    test('create adds new entity', async () => {
      const newEntity = {
        name: 'New API Entity',
        description: 'Created through API'
      };
      
      const result = await api.create(newEntity);
      
      console.log('API create result:', JSON.stringify(result));
      console.log('Repository after API create:', JSON.stringify(repository.mockData));
      
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
      
      console.log('API update result:', JSON.stringify(result));
      console.log('Repository after API update:', JSON.stringify(repository.mockData));
      
      expect(result.status).toBe('success');
      expect(result.data?.description).toBe('Updated through API');
      
      // Verify changes in repository
      const entity = await repository.select().eq('id', '1').maybeSingle();
      expect(entity.data?.description).toBe('Updated through API');
    });
    
    test('delete removes entity', async () => {
      // Verify entity exists before delete
      expect(repository.mockData.length).toBe(1);
      console.log('Repository before API delete:', JSON.stringify(repository.mockData));
      
      // Delete through API
      const result = await api.delete('1');
      
      console.log('API delete result:', JSON.stringify(result));
      console.log('Repository after API delete:', JSON.stringify(repository.mockData));
      
      expect(result.status).toBe('success');
      
      // Verify direct access to mockData
      expect(repository.mockData.length).toBe(0);
      
      // Verify it's deleted from repository through query
      const afterDelete = await repository.select().execute();
      expect(afterDelete.data?.length).toBe(0);
    });
  });
});
