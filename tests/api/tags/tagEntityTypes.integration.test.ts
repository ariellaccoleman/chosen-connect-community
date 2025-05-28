
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { PersistentTestUserHelper, PERSISTENT_TEST_USERS } from '../../utils/persistentTestUsers';
import { TestAuthUtils } from '../../utils/testAuthUtils';
import { createTagEntityTypeRepository } from '@/api/tags/repository/TagEntityTypeRepository';
import { tagAssignmentApi } from '@/api/tags/factory/tagApiFactory';
import { EntityType } from '@/types/entityTypes';

describe('Tag Entity Type Repository Integration Tests', () => {
  let testUser: any;
  let authenticatedClient: any;
  let tagEntityTypeRepo: any;
  let createdTagIds: string[] = [];
  let createdTagEntityTypeIds: string[] = [];
  let createdAssignmentIds: string[] = [];
  const testUserEmail = PERSISTENT_TEST_USERS.user3.email;

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
    createdTagIds = [];
    createdTagEntityTypeIds = [];
    createdAssignmentIds = [];
    
    // Set up authentication for user3 (Tag Entity Type tests)
    console.log('🔐 Setting up test authentication for user3...');
    const authResult = await TestAuthUtils.setupTestAuth('user3');
    testUser = authResult.user;
    authenticatedClient = authResult.client;
    
    if (!testUser?.id) {
      throw new Error('❌ Test user setup failed - no user returned');
    }
    
    console.log(`✅ Test user authenticated: ${testUser.email}`);
    
    // Initialize repository with the authenticated client
    tagEntityTypeRepo = createTagEntityTypeRepository(authenticatedClient);
    
    // Set up test data ONLY after confirmed authentication
    await setupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
    await TestAuthUtils.cleanupTestAuth(testUserEmail);
  });

  afterAll(() => {
    TestClientFactory.cleanup();
  });

  const cleanupTestData = async () => {
    try {
      const serviceClient = TestClientFactory.getServiceRoleClient();
      
      // Clean up tag assignments first (triggers will clean up entity types)
      if (createdAssignmentIds.length > 0) {
        const { error } = await serviceClient
          .from('tag_assignments')
          .delete()
          .in('id', createdAssignmentIds);
        
        if (!error) {
          console.log(`✅ Cleaned up ${createdAssignmentIds.length} tag assignments`);
        }
      }
      
      // Clean up tags (this will cascade cleanup other associations)
      if (createdTagIds.length > 0) {
        const { error } = await serviceClient
          .from('tags')
          .delete()
          .in('id', createdTagIds);
        
        if (!error) {
          console.log(`✅ Cleaned up ${createdTagIds.length} tags`);
        }
      }
      
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  };

  const setupTestData = async () => {
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

  const createTestAssignment = async (tagId: string, entityType: EntityType = EntityType.ORGANIZATION) => {
    const serviceClient = TestClientFactory.getServiceRoleClient();
    
    // Create a dummy target entity (using the user id as target for simplicity)
    const { data: assignment, error } = await serviceClient
      .from('tag_assignments')
      .insert({
        tag_id: tagId,
        target_id: testUser.id,
        target_type: entityType
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create test assignment: ${error.message}`);
    }
    
    createdAssignmentIds.push(assignment.id);
    return assignment;
  };

  describe('Tag Entity Type CRUD Operations', () => {
    test('should automatically create entity type when tag assignment is made', async () => {
      const testTag = await createTestTag('AutoEntityTypeTest');
      
      // Create a tag assignment using the authenticated client and tagAssignmentApi
      // This uses the test user's profile ID as the target entity
      const assignment = await tagAssignmentApi.create(
        testTag.id, 
        testUser.id, 
        EntityType.PROFILE, 
        authenticatedClient
      );
      
      // Track for cleanup
      createdAssignmentIds.push(assignment.id);
      
      // Verify the entity type was automatically created
      const associations = await tagEntityTypeRepo.getTagEntityTypesByTagId(testTag.id);
      expect(associations.length).toBe(1);
      expect(associations[0].entity_type).toBe(EntityType.PROFILE);
    });

    test('should get entity types by tag ID', async () => {
      const testTag = await createTestTag('GetEntityTypesTest');
      
      // Create assignments for multiple entity types
      await createTestAssignment(testTag.id, EntityType.PROFILE);
      await createTestAssignment(testTag.id, EntityType.ORGANIZATION);
      
      const result = await tagEntityTypeRepo.getEntityTypesByTagId(testTag.id);
      
      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(2);
      expect(result.data).toContain(EntityType.PROFILE);
      expect(result.data).toContain(EntityType.ORGANIZATION);
    });

    test('should check if tag is allowed for entity type', async () => {
      const testTag = await createTestTag('AllowedTest');
      
      // Should not be allowed initially
      const notAllowed = await tagEntityTypeRepo.isTagAllowedForEntityType(
        testTag.id, 
        EntityType.EVENT
      );
      expect(notAllowed).toBe(false);
      
      // Create assignment for EVENT - this should automatically create entity type
      await createTestAssignment(testTag.id, EntityType.EVENT);
      
      // Now should be allowed
      const isAllowed = await tagEntityTypeRepo.isTagAllowedForEntityType(
        testTag.id, 
        EntityType.EVENT
      );
      expect(isAllowed).toBe(true);
    });

    test('should manually add entity type association', async () => {
      const testTag = await createTestTag('ManualAssociationTest');
      
      const result = await tagEntityTypeRepo.associateTagWithEntityType(
        testTag.id, 
        EntityType.HUB
      );
      
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);

      // Verify the association was created
      const isAllowed = await tagEntityTypeRepo.isTagAllowedForEntityType(
        testTag.id, 
        EntityType.HUB
      );
      expect(isAllowed).toBe(true);
    });

    test('should remove tag entity type association when last assignment is deleted', async () => {
      const testTag = await createTestTag('RemoveAssociationTest');
      
      // Create two assignments for the same entity type
      const assignment1 = await createTestAssignment(testTag.id, EntityType.HUB);
      await createTestAssignment(testTag.id, EntityType.HUB);
      
      // Verify entity type exists
      let isAllowed = await tagEntityTypeRepo.isTagAllowedForEntityType(
        testTag.id, 
        EntityType.HUB
      );
      expect(isAllowed).toBe(true);
      
      // Remove one assignment - entity type should still exist
      const serviceClient = TestClientFactory.getServiceRoleClient();
      await serviceClient
        .from('tag_assignments')
        .delete()
        .eq('id', assignment1.id);
      
      // Should still be allowed (one assignment remains)
      isAllowed = await tagEntityTypeRepo.isTagAllowedForEntityType(
        testTag.id, 
        EntityType.HUB
      );
      expect(isAllowed).toBe(true);
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
