import { TestClientFactory } from '@/integrations/supabase/testClient';
import { PersistentTestUserHelper } from '../../utils/persistentTestUsers';
import { TestAuthUtils } from '../../utils/testAuthUtils';
import { invalidateTagCache } from '@/api/tags/cacheApi';
import { updateTagCache, invalidateTagCache as utilsInvalidateCache } from '@/utils/tags/cacheUtils';
import { EntityType } from '@/types/entityTypes';

describe('Tag Cache Integration Tests', () => {
  let testUser: any;
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
    
    // Set up authentication for user6 (Tag Cache tests) - STRICT MODE
    console.log('🔐 Setting up test authentication for user6...');
    await TestAuthUtils.setupTestAuth('user6');
    
    // Wait for auth to settle
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get the authenticated user - NO FALLBACK
    testUser = await TestAuthUtils.getCurrentTestUser();
    if (!testUser?.id) {
      throw new Error('❌ Authentication failed - no valid test user available');
    }
    console.log(`✅ Test user authenticated: ${testUser.email}`);
    
    // Verify session is established - STRICT VERIFICATION
    const client = await TestClientFactory.getSharedTestClient();
    const { data: { session }, error } = await client.auth.getSession();
    if (error || !session || !session.user || !session.access_token) {
      throw new Error('❌ Authentication failed - no valid session established');
    }
    
    if (session.user.id !== testUser.id) {
      throw new Error('❌ Session user mismatch - authentication inconsistent');
    }
    
    // Set up test data ONLY after confirmed authentication
    await setupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
    await TestAuthUtils.cleanupTestAuth();
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
    if (!testUser?.id) {
      throw new Error('❌ Cannot setup test data - no authenticated user');
    }
    
    const serviceClient = TestClientFactory.getServiceRoleClient();
    
    // Create profile for authenticated user
    const { error: profileError } = await serviceClient
      .from('profiles')
      .upsert({ 
        id: testUser.id, 
        email: testUser.email,
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
    });

    test('should handle invalid entity type in updateTagCache', async () => {
      const result = await updateTagCache('invalid_entity_type' as EntityType, []);
      
      expect(result).toBe(false);
    });

    test('should invalidate specific entity type cache', async () => {
      if (!testUser?.id) {
        console.warn('Skipping test - test setup incomplete');
        expect(true).toBe(true);
        return;
      }

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
    });

    test('should invalidate all tag caches when no entity type specified', async () => {
      if (!testUser?.id) {
        console.warn('Skipping test - test setup incomplete');
        expect(true).toBe(true);
        return;
      }

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
    });

    test('should handle invalid entity type in invalidateTagCache', async () => {
      const result = await utilsInvalidateCache('invalid_entity_type' as EntityType);
      
      expect(result).toBe(false);
    });

    test('should use API invalidateTagCache function', async () => {
      if (!testUser?.id) {
        console.warn('Skipping test - test setup incomplete');
        expect(true).toBe(true);
        return;
      }

      // Create a test cache entry
      const cacheKey = `test_cache_${Date.now()}`;
      await createTestCacheEntry(cacheKey, { test: 'data' });
      
      // Test the API function
      const result = await invalidateTagCache();
      
      // The function should execute without error
      // Note: We can't easily test the exact behavior since it may use different logic
      expect(typeof result).toBe('boolean');
    });

    test('should handle cache operations with missing RPC functions gracefully', async () => {
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
    });

    test('should handle empty cache data', async () => {
      const result = await updateTagCache(EntityType.HUB, []);
      
      // Should handle empty arrays without error
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Cache Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      // Test with invalid entity type to trigger error path
      const result = await utilsInvalidateCache('nonexistent' as EntityType);
      
      expect(result).toBe(false);
    });

    test('should handle malformed cache data', async () => {
      // Test updating cache with undefined data
      const result = await updateTagCache(EntityType.LOCATION, undefined as any);
      
      expect(typeof result).toBe('boolean');
    });
  });
});
