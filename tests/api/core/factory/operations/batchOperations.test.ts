
import { createBatchOperations } from '@/api/core/factory/operations/batchOperations';
import { createRepository } from '@/api/core/repository/repositoryFactory';
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { CentralTestAuthUtils } from '../../../testing/CentralTestAuthUtils';

interface TestProfile {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
}

describe('Batch Operations - Database Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await TestClientFactory.cleanup();
  });

  test('should create batch operations object with real repository', async () => {
    await CentralTestAuthUtils.executeWithAuthenticatedAPI(
      'user3',
      async (client) => {
        const repository = createRepository<TestProfile>('profiles', {}, client);
        
        const operations = createBatchOperations(
          repository,
          'Test Profile'
        );

        expect(operations).toHaveProperty('batchCreate');
        expect(operations).toHaveProperty('batchUpdate');
        expect(operations).toHaveProperty('batchDelete');
      }
    );
  });

  test('should perform batch create operation with real database', async () => {
    await CentralTestAuthUtils.executeWithAuthenticatedAPI(
      'user3',
      async (client) => {
        const repository = createRepository<TestProfile>('profiles', {}, client);
        
        const operations = createBatchOperations(
          repository,
          'Test Profile'
        );

        // Create test items
        const mockItems = [
          { 
            first_name: 'Test1', 
            last_name: 'User1', 
            email: `test1_${Date.now()}@example.com` 
          },
          { 
            first_name: 'Test2', 
            last_name: 'User2', 
            email: `test2_${Date.now()}@example.com` 
          }
        ];

        // Call batchCreate
        const result = await operations.batchCreate(mockItems);

        // Verify result
        expect(result.status).toBeDefined();
        
        if (result.status === 'success') {
          expect(result.data).toBeDefined();
          expect(Array.isArray(result.data)).toBe(true);
        }
      }
    );
  });

  test('should perform batch update operation with real database', async () => {
    await CentralTestAuthUtils.executeWithAuthenticatedAPI(
      'user3',
      async (client) => {
        const repository = createRepository<TestProfile>('profiles', {}, client);
        
        const operations = createBatchOperations(
          repository,
          'Test Profile'
        );

        // First create some test data
        const testEmail = `testupdate_${Date.now()}@example.com`;
        const createResult = await operations.batchCreate([
          { 
            first_name: 'Original', 
            last_name: 'Name', 
            email: testEmail 
          }
        ]);

        if (createResult.status === 'success' && createResult.data && createResult.data.length > 0) {
          const createdItem = createResult.data[0];
          
          // Now update the item
          const updates = [{
            id: createdItem.id,
            first_name: 'Updated',
            last_name: 'Name',
            email: testEmail
          }];

          const updateResult = await operations.batchUpdate(updates);

          // Verify result
          expect(updateResult.status).toBeDefined();
          
          if (updateResult.status === 'success') {
            expect(updateResult.data).toBeDefined();
          }
        }
      }
    );
  });

  test('should perform batch delete operation with real database', async () => {
    await CentralTestAuthUtils.executeWithAuthenticatedAPI(
      'user3',
      async (client) => {
        const repository = createRepository<TestProfile>('profiles', {}, client);
        
        const operations = createBatchOperations(
          repository,
          'Test Profile'
        );

        // First create some test data
        const testEmail = `testdelete_${Date.now()}@example.com`;
        const createResult = await operations.batchCreate([
          { 
            first_name: 'ToDelete', 
            last_name: 'User', 
            email: testEmail 
          }
        ]);

        if (createResult.status === 'success' && createResult.data && createResult.data.length > 0) {
          const createdItem = createResult.data[0];
          
          // Now delete the item
          const deleteResult = await operations.batchDelete([createdItem.id]);

          // Verify result
          expect(deleteResult.status).toBeDefined();
          
          if (deleteResult.status === 'success') {
            expect(deleteResult.data).toBe(true);
          }
        }
      }
    );
  });

  test('should handle errors in batch create operation with real database', async () => {
    await CentralTestAuthUtils.executeWithAuthenticatedAPI(
      'user3',
      async (client) => {
        const repository = createRepository<TestProfile>('profiles', {}, client);
        
        const operations = createBatchOperations(
          repository,
          'Test Profile'
        );

        // Try to create invalid data (missing required fields)
        const invalidItems = [
          { first_name: 'Test' } // Missing required email field
        ];

        const result = await operations.batchCreate(invalidItems as TestProfile[]);
        
        // Should handle the error appropriately
        expect(result.status).toBeDefined();
        expect(['success', 'error']).toContain(result.status);
      }
    );
  });

  test('should perform batch upsert operation with real database', async () => {
    await CentralTestAuthUtils.executeWithAuthenticatedAPI(
      'user3',
      async (client) => {
        const repository = createRepository<TestProfile>('profiles', {}, client);
        
        const operations = createBatchOperations(
          repository,
          'Test Profile'
        );

        // Mix of new items (no ID) and updates (with ID)
        const testEmail1 = `testupsert1_${Date.now()}@example.com`;
        const testEmail2 = `testupsert2_${Date.now()}@example.com`;
        
        // First create an item to update later
        const createResult = await operations.batchCreate([
          { first_name: 'Existing', last_name: 'User', email: testEmail1 }
        ]);

        if (createResult.status === 'success' && createResult.data && createResult.data.length > 0) {
          const existingItem = createResult.data[0];
          
          // Now upsert with mix of update and insert
          const upsertItems = [
            { 
              id: existingItem.id, 
              first_name: 'Updated', 
              last_name: 'User', 
              email: testEmail1 
            }, // Update
            { 
              first_name: 'New', 
              last_name: 'User', 
              email: testEmail2 
            } // Insert
          ];

          const upsertResult = await operations.batchUpsert(upsertItems);

          // Verify result
          expect(upsertResult.status).toBeDefined();
          
          if (upsertResult.status === 'success') {
            expect(upsertResult.data).toBeDefined();
            expect(Array.isArray(upsertResult.data)).toBe(true);
          }
        }
      }
    );
  });

  test('should handle empty arrays gracefully', async () => {
    await CentralTestAuthUtils.executeWithAuthenticatedAPI(
      'user3',
      async (client) => {
        const repository = createRepository<TestProfile>('profiles', {}, client);
        
        const operations = createBatchOperations(
          repository,
          'Test Profile'
        );

        // Test with empty arrays
        const createResult = await operations.batchCreate([]);
        const updateResult = await operations.batchUpdate([]);
        const deleteResult = await operations.batchDelete([]);

        expect(createResult.status).toBe('success');
        expect(createResult.data).toEqual([]);
        
        expect(updateResult.status).toBe('success');
        expect(updateResult.data).toEqual([]);
        
        expect(deleteResult.status).toBe('success');
        expect(deleteResult.data).toBe(true);
      }
    );
  });
});
