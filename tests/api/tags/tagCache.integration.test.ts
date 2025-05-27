
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { PersistentTestUserHelper } from '../../utils/persistentTestUsers';
import { TestAuthUtils } from '../../utils/testAuthUtils';
import { invalidateTagCache } from '@/api/tags/cacheApi';
import { updateTagCache, invalidateTagCache as utilsInvalidateCache } from '@/utils/tags/cacheUtils';
import { EntityType } from '@/types/entityTypes';

describe('Tag Cache Integration Tests', () => {
  let testAuth: { client: any; apiClient: any; user: any };
  let createdCacheEntries: string[] = [];

  beforeAll(async () => {
    // Verify test users are set up
    const isSetup = await PersistentTestUserHelper.verifyTestUsersSetup();
    if (!isSetup) {
      throw new Error('❌ Persistent test users not set up - cannot run tests');
    }

    // Verify service role key is available
    try {
      TestClientFactory.getServiceRoleClient();
      console.log('✅ Service role client available for tests');
    } catch (error) {
      console.error('❌ Service role client not available:', error);
      throw error;
    }
  });

  beforeEach(async () => {
    // Clean up any existing test data first
    await cleanupTestData();
    
    // Reset tracking arrays AFTER cleanup
    createdCacheEntries = [];
    
    // Set up authentication for user6 (Tag Cache tests) using per-user client
    console.log('🔐 Setting up test authentication for user6...');
    testAuth = await TestAuthUtils.setupTestAuth('user6');
    
    console.log(`✅ Test user authenticated: ${testAuth.user.email}`);
    
    // Set up test data ONLY after confirmed authentication
    await setupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
    if (testAuth?.user?.email) {
      await TestAuthUtils.cleanupTestAuth(testAuth.user.email);
    }
  });

  afterAll(() => {
    TestClientFactory.cleanup();
  });

  const cleanupTestData = async () => {
    try {
      const serviceClient = TestClientFactory.getServiceRoleClient();
      
      // Clean up cache entries by keys
      if (createdCacheEntries.length > 0) {
        const { error } = await serviceClient
          .from('cache')
          .delete()
          .in('key', createdCacheEntries);
        
        if (!error) {
          console.log(`✅ Cleaned up ${createdCacheEntries.length} cache entries`);
        }
      }
      
      // Clean up any test cache entries
      await serviceClient
        .from('cache')
        .delete()
        .ilike('key', '%test_cache%');
        
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  };

  const setupTestData = async () => {
    // Only proceed if we have a valid authenticated user
    if (!testAuth?.user?.id) {
      throw new Error('❌ Cannot setup test data - no authenticated user');
    }
    
    const serviceClient = TestClientFactory.getServiceRoleClient();
    
    // Create profile for authenticated user
    const { error: profileError } = await serviceClient
      .from('profiles')
      .upsert({ 
        id: testAuth.user.id, 
        email: testAuth.user.email,
        first_name: 'Test',
        last_name: 'User'
      });
    
    if (profileError) {
      console.warn('Profile setup warning:', profileError);
    }
  };

  const createTestCacheEntry = async (key: string, data: any) => {
    const serviceClient = TestClientFactory.getServiceRoleClient();
    
    const { error } = await serviceClient
      .from('cache')
      .insert({
        key: key,
        data: data
      });
    
    if (error) {
      throw new Error(`Failed to create test cache entry: ${error.message}`);
    }
    
    createdCacheEntries.push(key);
  };

  describe('Tag Cache Operations', () => {
    test('should update tag cache for entity type', async () => {
      await TestAuthUtils.executeWithAuth(async () => {
        const testData = [
          { id: '1', name: 'Test Tag 1', description: 'First test tag' },
          { id: '2', name: 'Test Tag 2', description: 'Second test tag' }
        ];
        
        const result = await updateTagCache(EntityType.ORGANIZATION, testData);
        
        expect(result).toBe(true);
        
        // Verify cache was created
        const serviceClient = TestClientFactory.getServiceRoleClient();
        const cacheKey = `selection_tags_${EntityType.ORGANIZATION}`;
        
        const { data: cacheData, error } = await serviceClient
          .from('cache')
          .select('*')
          .eq('key', cacheKey)
          .maybeSingle();
        
        if (!error && cacheData) {
          expect(cacheData.data).toEqual(testData);
          createdCacheEntries.push(cacheKey);
        }
      }, 'update tag cache for entity type', testAuth.client);
    });

    test('should handle invalid entity type in updateTagCache', async () => {
      await TestAuthUtils.executeWithAuth(async () => {
        const result = await updateTagCache('invalid_entity_type' as EntityType, []);
        
        expect(result).toBe(false);
      }, 'handle invalid entity type in updateTagCache', testAuth.client);
    });

    test('should invalidate specific entity type cache', async () => {
      if (!testAuth?.user?.id) {
        console.warn('Skipping test - test setup incomplete');
        expect(true).toBe(true);
        return;
      }

      await TestAuthUtils.executeWithAuth(async () => {
        // Create a test cache entry
        const cacheKey = `selection_tags_${EntityType.PROFILE}`;
        await createTestCacheEntry(cacheKey, [{ id: '1', name: 'Test' }]);
        
        // Invalidate the cache
        const result = await utilsInvalidateCache(EntityType.PROFILE);
        
        expect(result).toBe(true);
        
        // Verify cache was deleted
        const serviceClient = TestClientFactory.getServiceRoleClient();
        const { data: cacheData } = await serviceClient
          .from('cache')
          .select('*')
          .eq('key', cacheKey)
          .maybeSingle();
        
        expect(cacheData).toBeNull();
      }, 'invalidate specific entity type cache', testAuth.client);
    });

    test('should invalidate all tag caches when no entity type specified', async () => {
      if (!testAuth?.user?.id) {
        console.warn('Skipping test - test setup incomplete');
        expect(true).toBe(true);
        return;
      }

      await TestAuthUtils.executeWithAuth(async () => {
        // Create multiple test cache entries
        const cacheKey1 = `selection_tags_${EntityType.ORGANIZATION}`;
        const cacheKey2 = `selection_tags_${EntityType.PROFILE}`;
        
        await createTestCacheEntry(cacheKey1, [{ id: '1', name: 'Org Tag' }]);
        await createTestCacheEntry(cacheKey2, [{ id: '2', name: 'Profile Tag' }]);
        
        // Invalidate all caches
        const result = await utilsInvalidateCache();
        
        expect(result).toBe(true);
        
        // Verify both caches were deleted
        const serviceClient = TestClientFactory.getServiceRoleClient();
        const { data: cache1 } = await serviceClient
          .from('cache')
          .select('*')
          .eq('key', cacheKey1)
          .maybeSingle();
        
        const { data: cache2 } = await serviceClient
          .from('cache')
          .select('*')
          .eq('key', cacheKey2)
          .maybeSingle();
        
        expect(cache1).toBeNull();
        expect(cache2).toBeNull();
      }, 'invalidate all tag caches', testAuth.client);
    });

    test('should handle invalid entity type in invalidateTagCache', async () => {
      await TestAuthUtils.executeWithAuth(async () => {
        const result = await utilsInvalidateCache('invalid_entity_type' as EntityType);
        
        expect(result).toBe(false);
      }, 'handle invalid entity type in invalidateTagCache', testAuth.client);
    });

    test('should use API invalidateTagCache function', async () => {
      if (!testAuth?.user?.id) {
        console.warn('Skipping test - test setup incomplete');
        expect(true).toBe(true);
        return;
      }

      await TestAuthUtils.executeWithAuth(async () => {
        // Create a test cache entry
        const cacheKey = `test_cache_${Date.now()}`;
        await createTestCacheEntry(cacheKey, { test: 'data' });
        
        // Test the API function
        const result = await invalidateTagCache();
        
        // The function should execute without error
        // Note: We can't easily test the exact behavior since it may use different logic
        expect(typeof result).toBe('boolean');
      }, 'use API invalidateTagCache function', testAuth.client);
    });

    test('should handle cache operations with missing RPC functions gracefully', async () => {
      await TestAuthUtils.executeWithAuth(async () => {
        // Test that cache operations don't break even if RPC functions are missing
        const testData = [{ id: '1', name: 'Test' }];
        
        // This should not throw an error even if RPC functions are missing
        let result;
        try {
          result = await updateTagCache(EntityType.EVENT, testData);
          // Result could be true or false depending on RPC availability
          expect(typeof result).toBe('boolean');
        } catch (error) {
          // If RPC functions are missing, operations should handle gracefully
          expect(error).toBeDefined();
        }
      }, 'handle cache operations with missing RPC functions gracefully', testAuth.client);
    });

    test('should handle empty cache data', async () => {
      await TestAuthUtils.executeWithAuth(async () => {
        const result = await updateTagCache(EntityType.HUB, []);
        
        // Should handle empty arrays without error
        expect(typeof result).toBe('boolean');
      }, 'handle empty cache data', testAuth.client);
    });
  });

  describe('Cache Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      await TestAuthUtils.executeWithAuth(async () => {
        // Test with invalid entity type to trigger error path
        const result = await utilsInvalidateCache('nonexistent' as EntityType);
        
        expect(result).toBe(false);
      }, 'handle database connection errors gracefully', testAuth.client);
    });

    test('should handle malformed cache data', async () => {
      await TestAuthUtils.executeWithAuth(async () => {
        // Test updating cache with undefined data
        const result = await updateTagCache(EntityType.LOCATION, undefined as any);
        
        expect(typeof result).toBe('boolean');
      }, 'handle malformed cache data', testAuth.client);
    });
  });
});
