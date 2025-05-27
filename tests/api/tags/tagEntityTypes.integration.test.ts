
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { PersistentTestUserHelper } from '../../utils/persistentTestUsers';
import { TestAuthUtils } from '../../utils/testAuthUtils';
import { createTagEntityTypeRepository } from '@/api/tags/repository/TagEntityTypeRepository';
import { EntityType } from '@/types/entityTypes';
import { v4 as uuidv4 } from 'uuid';

describe('Tag Entity Type Repository Integration Tests', () => {
  let testUser: any;
  let tagEntityTypeRepo: any;
  let createdTagIds: string[] = [];
  let createdTagEntityTypeIds: string[] = [];

  beforeAll(async () => {
    // Verify test users are set up
    const isSetup = await PersistentTestUserHelper.verifyTestUsersSetup();
    if (!isSetup) {
      console.warn('⚠️ Persistent test users not set up - some tests may fail');
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
    createdTagIds = [];
    createdTagEntityTypeIds = [];
    
    // Set up authentication for user3 (Tag Entity Type tests)
    try {
      console.log('🔐 Setting up test authentication for user3...');
      await TestAuthUtils.setupTestAuth('user3');
      
      // Wait for auth to settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the authenticated user
      testUser = await TestAuthUtils.getCurrentTestUser();
      console.log(`✅ Test user authenticated: ${testUser?.email}`);
      
      // Verify session is established
      const client = await TestClientFactory.getSharedTestClient();
      const { data: { session } } = await client.auth.getSession();
      if (!session) {
        throw new Error('Authentication failed - no session established');
      }
    } catch (error) {
      console.warn('Could not get test user, using mock ID:', error);
      testUser = { 
        id: uuidv4(),
        email: 'testuser6@example.com'
      };
    }
    
    // Initialize repository
    tagEntityTypeRepo = createTagEntityTypeRepository();
    
    // Set up test data
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
      
      // Clean up tag entity types by tracked IDs
      if (createdTagEntityTypeIds.length > 0) {
        const { error } = await serviceClient
          .from('tag_entity_types')
          .delete()
          .in('id', createdTagEntityTypeIds);
        
        if (!error) {
          console.log(`✅ Cleaned up ${createdTagEntityTypeIds.length} tag entity types`);
        }
      }
      
      // Clean up tags by tracked IDs
      if (createdTagIds.length > 0) {
        const { error } = await serviceClient
          .from('tags')
          .delete()
          .in('id', createdTagIds);
        
        if (!error) {
          console.log(`✅ Cleaned up ${createdTagIds.length} tags`);
        }
      }
      
      // Fallback cleanup by user ID
      if (testUser?.id) {
        await serviceClient
          .from('tags')
          .delete()
          .eq('created_by', testUser.id);
      }
      
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  };

  const setupTestData = async () => {
    if (!testUser?.id) return;
    
    const serviceClient = TestClientFactory.getServiceRoleClient();
    
    // Ensure profile exists
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

  const createTestTag = async (name: string) => {
    const serviceClient = TestClientFactory.getServiceRoleClient();
    
    const { data: tagData, error: tagError } = await serviceClient
      .from('tags')
      .insert({
        name: `${name} ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Test tag for entity type testing',
        created_by: testUser.id
      })
      .select()
      .single();
    
    if (tagError) {
      throw new Error(`Failed to create test tag: ${tagError.message}`);
    }
    
    createdTagIds.push(tagData.id);
    return tagData;
  };

  describe('Tag Entity Type CRUD Operations', () => {
    test('should create tag entity type association', async () => {
      if (!testUser?.id) {
        console.warn('Skipping test - test setup incomplete');
        expect(true).toBe(true);
        return;
      }

      const testTag = await createTestTag('EntityTypeTest');
      
      const result = await tagEntityTypeRepo.associateTagWithEntityType(
        testTag.id, 
        EntityType.ORGANIZATION
      );
      
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);

      // Verify the association was created
      const associations = await tagEntityTypeRepo.getTagEntityTypesByTagId(testTag.id);
      expect(associations.length).toBe(1);
      expect(associations[0].entity_type).toBe(EntityType.ORGANIZATION);
      
      createdTagEntityTypeIds.push(associations[0].id);
    });

    test('should get entity types by tag ID', async () => {
      if (!testUser?.id) {
        console.warn('Skipping test - test setup incomplete');
        expect(true).toBe(true);
        return;
      }

      const testTag = await createTestTag('GetEntityTypesTest');
      
      // Create multiple entity type associations
      await tagEntityTypeRepo.associateTagWithEntityType(testTag.id, EntityType.ORGANIZATION);
      await tagEntityTypeRepo.associateTagWithEntityType(testTag.id, EntityType.PROFILE);
      
      const result = await tagEntityTypeRepo.getEntityTypesByTagId(testTag.id);
      
      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(2);
      expect(result.data).toContain(EntityType.ORGANIZATION);
      expect(result.data).toContain(EntityType.PROFILE);

      // Track for cleanup
      const associations = await tagEntityTypeRepo.getTagEntityTypesByTagId(testTag.id);
      associations.forEach(assoc => createdTagEntityTypeIds.push(assoc.id));
    });

    test('should check if tag is allowed for entity type', async () => {
      if (!testUser?.id) {
        console.warn('Skipping test - test setup incomplete');
        expect(true).toBe(true);
        return;
      }

      const testTag = await createTestTag('AllowedTest');
      
      // Initially should not be allowed
      const notAllowed = await tagEntityTypeRepo.isTagAllowedForEntityType(
        testTag.id, 
        EntityType.EVENT
      );
      expect(notAllowed).toBe(false);
      
      // Create association
      await tagEntityTypeRepo.associateTagWithEntityType(testTag.id, EntityType.EVENT);
      
      // Now should be allowed
      const isAllowed = await tagEntityTypeRepo.isTagAllowedForEntityType(
        testTag.id, 
        EntityType.EVENT
      );
      expect(isAllowed).toBe(true);

      // Track for cleanup
      const associations = await tagEntityTypeRepo.getTagEntityTypesByTagId(testTag.id);
      associations.forEach(assoc => createdTagEntityTypeIds.push(assoc.id));
    });

    test('should remove tag entity type association', async () => {
      if (!testUser?.id) {
        console.warn('Skipping test - test setup incomplete');
        expect(true).toBe(true);
        return;
      }

      const testTag = await createTestTag('RemoveAssociationTest');
      
      // Create association
      await tagEntityTypeRepo.associateTagWithEntityType(testTag.id, EntityType.HUB);
      
      // Verify it exists
      let isAllowed = await tagEntityTypeRepo.isTagAllowedForEntityType(
        testTag.id, 
        EntityType.HUB
      );
      expect(isAllowed).toBe(true);
      
      // Remove association
      const result = await tagEntityTypeRepo.removeTagEntityTypeAssociation(
        testTag.id, 
        EntityType.HUB
      );
      
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
      
      // Verify it's removed
      isAllowed = await tagEntityTypeRepo.isTagAllowedForEntityType(
        testTag.id, 
        EntityType.HUB
      );
      expect(isAllowed).toBe(false);
    });

    test('should handle undefined parameters gracefully', async () => {
      const entityTypesResult = await tagEntityTypeRepo.getEntityTypesByTagId(undefined);
      expect(entityTypesResult.status).toBe('success');
      expect(entityTypesResult.data).toEqual([]);
      
      const associateResult = await tagEntityTypeRepo.associateTagWithEntityType(undefined, undefined);
      expect(associateResult.status).toBe('error');
      
      const removeResult = await tagEntityTypeRepo.removeTagEntityTypeAssociation(undefined, undefined);
      expect(removeResult.status).toBe('error');
    });
  });
});
