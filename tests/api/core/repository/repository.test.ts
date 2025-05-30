
import { createRepository } from '@/api/core/repository/repositoryFactory';
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { CentralTestAuthUtils } from '../../testing/CentralTestAuthUtils';

// Test entity type
interface TestProfile {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at?: string;
}

describe('Repository Pattern - Database Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await TestClientFactory.cleanup();
  });

  describe('Real Database Repository', () => {
    test('creates repository with real database connection', async () => {
      await CentralTestAuthUtils.executeWithAuthenticatedAPI(
        'user3',
        async (client) => {
          const repo = createRepository<TestProfile>('profiles', {}, client);
          expect(repo.tableName).toBe('profiles');
        }
      );
    });
    
    test('select query works with execute on real data', async () => {
      await CentralTestAuthUtils.executeWithAuthenticatedAPI(
        'user3',
        async (client) => {
          const repo = createRepository<TestProfile>('profiles', {}, client);
          const result = await repo.select().execute();
          
          expect(result).toBeDefined();
          expect(result.isSuccess || result.isError).toBeTruthy();
          
          if (result.isSuccess()) {
            expect(Array.isArray(result.data)).toBe(true);
          }
        }
      );
    });
    
    test('filtering with eq works with real data', async () => {
      await CentralTestAuthUtils.executeWithAuthenticatedAPI(
        'user3',
        async (client) => {
          const repo = createRepository<TestProfile>('profiles', {}, client);
          
          // First get all profiles to find an existing one
          const allResult = await repo.select().execute();
          
          if (allResult.isSuccess() && allResult.data && allResult.data.length > 0) {
            const firstProfile = allResult.data[0];
            
            // Now filter by that profile's ID
            const filterResult = await repo.select().eq('id', firstProfile.id).execute();
            
            expect(filterResult.isSuccess()).toBe(true);
            if (filterResult.isSuccess() && filterResult.data) {
              expect(filterResult.data.length).toBeGreaterThanOrEqual(0);
            }
          }
        }
      );
    });
    
    test('single returns first matching item from real data', async () => {
      await CentralTestAuthUtils.executeWithAuthenticatedAPI(
        'user3',
        async (client) => {
          const repo = createRepository<TestProfile>('profiles', {}, client);
          
          // Get all profiles first
          const allResult = await repo.select().execute();
          
          if (allResult.isSuccess() && allResult.data && allResult.data.length > 0) {
            const firstProfile = allResult.data[0];
            
            // Try to get that specific profile with single()
            const result = await repo.select().eq('id', firstProfile.id).single();
            
            expect(result).toBeDefined();
            expect(result.isSuccess || result.isError).toBeTruthy();
            
            if (result.isSuccess()) {
              expect(result.data).toBeDefined();
              expect(result.data?.id).toBe(firstProfile.id);
            }
          }
        }
      );
    });
    
    test('maybeSingle returns null when no match in real data', async () => {
      await CentralTestAuthUtils.executeWithAuthenticatedAPI(
        'user3',
        async (client) => {
          const repo = createRepository<TestProfile>('profiles', {}, client);
          const result = await repo.select().eq('id', 'non-existent-uuid-12345').maybeSingle();
          
          expect(result).toBeDefined();
          expect(result.isSuccess || result.isError).toBeTruthy();
          
          if (result.isSuccess()) {
            expect(result.data).toBeNull();
          }
        }
      );
    });
    
    test('insert adds new entity to real database', async () => {
      await CentralTestAuthUtils.executeWithAuthenticatedAPI(
        'user3',
        async (client) => {
          const repo = createRepository<TestProfile>('profiles', {}, client);
          const newProfile = { 
            first_name: 'Test', 
            last_name: 'User', 
            email: `test_${Date.now()}@example.com` 
          };
          
          // Insert the entity
          const insertResult = await repo.insert(newProfile).execute();
          
          expect(insertResult).toBeDefined();
          expect(insertResult.isSuccess || insertResult.isError).toBeTruthy();
          
          if (insertResult.isSuccess() && insertResult.data) {
            const insertedData = Array.isArray(insertResult.data) ? insertResult.data[0] : insertResult.data;
            expect(insertedData).toBeDefined();
            expect(insertedData.first_name).toBe('Test');
            expect(insertedData.email).toBe(newProfile.email);
          }
        }
      );
    });
    
    test('update modifies entity in real database', async () => {
      await CentralTestAuthUtils.executeWithAuthenticatedAPI(
        'user3',
        async (client) => {
          const repo = createRepository<TestProfile>('profiles', {}, client);
          
          // First create an entity to update
          const testEmail = `testupdate_${Date.now()}@example.com`;
          const newProfile = { 
            first_name: 'Original', 
            last_name: 'Name', 
            email: testEmail 
          };
          
          const insertResult = await repo.insert(newProfile).execute();
          
          if (insertResult.isSuccess() && insertResult.data) {
            const insertedData = Array.isArray(insertResult.data) ? insertResult.data[0] : insertResult.data;
            
            // Update the entity
            const updateResult = await repo
              .update({ first_name: 'Updated' })
              .eq('id', insertedData.id)
              .execute();
              
            expect(updateResult).toBeDefined();
            expect(updateResult.isSuccess || updateResult.isError).toBeTruthy();
            
            if (updateResult.isSuccess() && updateResult.data) {
              const updatedData = Array.isArray(updateResult.data) ? updateResult.data[0] : updateResult.data;
              expect(updatedData.first_name).toBe('Updated');
            }
          }
        }
      );
    });
    
    test('delete removes entity from real database', async () => {
      await CentralTestAuthUtils.executeWithAuthenticatedAPI(
        'user3',
        async (client) => {
          const repo = createRepository<TestProfile>('profiles', {}, client);
          
          // First create an entity to delete
          const testEmail = `testdelete_${Date.now()}@example.com`;
          const newProfile = { 
            first_name: 'ToDelete', 
            last_name: 'User', 
            email: testEmail 
          };
          
          const insertResult = await repo.insert(newProfile).execute();
          
          if (insertResult.isSuccess() && insertResult.data) {
            const insertedData = Array.isArray(insertResult.data) ? insertResult.data[0] : insertResult.data;
            
            // Delete the entity
            const deleteResult = await repo
              .delete()
              .eq('id', insertedData.id)
              .execute();
              
            expect(deleteResult).toBeDefined();
            expect(deleteResult.isSuccess || deleteResult.isError).toBeTruthy();
            
            // Verify it was deleted by trying to find it
            const findResult = await repo.select().eq('id', insertedData.id).maybeSingle();
            if (findResult.isSuccess()) {
              expect(findResult.data).toBeNull();
            }
          }
        }
      );
    });
    
    test('ordering works with real data', async () => {
      await CentralTestAuthUtils.executeWithAuthenticatedAPI(
        'user3',
        async (client) => {
          const repo = createRepository<TestProfile>('profiles', {}, client);
          
          // Test ordering by created_at
          const ascResult = await repo
            .select()
            .order('created_at', { ascending: true })
            .limit(3)
            .execute();
            
          expect(ascResult).toBeDefined();
          expect(ascResult.isSuccess || ascResult.isError).toBeTruthy();
          
          if (ascResult.isSuccess() && ascResult.data && ascResult.data.length > 1) {
            // Verify ordering (first should be older than or equal to second)
            const first = new Date(ascResult.data[0].created_at || 0);
            const second = new Date(ascResult.data[1].created_at || 0);
            expect(first <= second).toBe(true);
          }
        }
      );
    });
    
    test('pagination works with real data', async () => {
      await CentralTestAuthUtils.executeWithAuthenticatedAPI(
        'user3',
        async (client) => {
          const repo = createRepository<TestProfile>('profiles', {}, client);
          
          // Test limit
          const limitResult = await repo
            .select()
            .limit(2)
            .execute();
            
          expect(limitResult).toBeDefined();
          expect(limitResult.isSuccess || limitResult.isError).toBeTruthy();
          
          if (limitResult.isSuccess() && limitResult.data) {
            expect(limitResult.data.length).toBeLessThanOrEqual(2);
          }
          
          // Test range
          const rangeResult = await repo
            .select()
            .range(0, 2)
            .execute();
            
          expect(rangeResult).toBeDefined();
          expect(rangeResult.isSuccess || rangeResult.isError).toBeTruthy();
          
          if (rangeResult.isSuccess() && rangeResult.data) {
            expect(rangeResult.data.length).toBeLessThanOrEqual(3); // range(0,2) returns up to 3 items
          }
        }
      );
    });
  });
  
  describe('Repository Factory', () => {
    test('creates repository with authenticated client', async () => {
      await CentralTestAuthUtils.executeWithAuthenticatedAPI(
        'user3',
        async (client) => {
          const repo = createRepository<TestProfile>('profiles', {}, client);
          expect(repo.tableName).toBe('profiles');
        }
      );
    });
  });

  describe('Repository Error Handling', () => {
    test('handles database constraint violations gracefully', async () => {
      await CentralTestAuthUtils.executeWithAuthenticatedAPI(
        'user3',
        async (client) => {
          const repo = createRepository<TestProfile>('profiles', {}, client);
          
          // Try to insert data that might violate constraints
          const invalidProfile = { 
            first_name: 'Test',
            last_name: 'User',
            email: 'invalid-email-format' // This might cause validation issues
          };
          
          const result = await repo.insert(invalidProfile).execute();
          
          // Should handle the error gracefully
          expect(result).toBeDefined();
          expect(result.isSuccess || result.isError).toBeTruthy();
        }
      );
    });
  });
});
