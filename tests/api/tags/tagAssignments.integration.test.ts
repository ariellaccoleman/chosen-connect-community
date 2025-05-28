
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { PersistentTestUserHelper, PERSISTENT_TEST_USERS } from '../../utils/persistentTestUsers';
import { TestAuthUtils } from '../../utils/testAuthUtils';
import { createTagAssignmentRepository } from '@/api/tags/repository/TagAssignmentRepository';
import { EntityType } from '@/types/entityTypes';

describe('Tag Assignment Repository Integration Tests', () => {
  let testUser: any;
  let authenticatedClient: any;
  let tagAssignmentRepo: any;
  let createdTagIds: string[] = [];
  let createdAssignmentIds: string[] = [];
  let createdOrganizationIds: string[] = [];
  const testUserEmail = PERSISTENT_TEST_USERS.user4.email;

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
    createdAssignmentIds = [];
    createdOrganizationIds = [];
    
    // Set up authentication for user4 (Tag Assignment tests)
    console.log('🔐 Setting up test authentication for user4...');
    const authResult = await TestAuthUtils.setupTestAuth('user4');
    testUser = authResult.user;
    authenticatedClient = authResult.client;
    
    if (!testUser?.id) {
      throw new Error('❌ Test user setup failed - no user returned');
    }
    
    console.log(`✅ Test user authenticated: ${testUser.email}`);
    
    // Initialize repository with the authenticated client
    tagAssignmentRepo = createTagAssignmentRepository(authenticatedClient);
    
    // Set up test data ONLY after confirmed authentication
    await setupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
    await TestAuthUtils.cleanupTestAuth(testUserEmail);
  });

  afterAll(async () => {
    await TestClientFactory.cleanup();
  });

  const cleanupTestData = async () => {
    try {
      const serviceClient = TestClientFactory.getServiceRoleClient();
      
      // Clean up tag assignments by tracked IDs
      if (createdAssignmentIds.length > 0) {
        const { error } = await serviceClient
          .from('tag_assignments')
          .delete()
          .in('id', createdAssignmentIds);
        
        if (!error) {
          console.log(`✅ Cleaned up ${createdAssignmentIds.length} tag assignments`);
        }
      }
      
      // Clean up organizations
      if (createdOrganizationIds.length > 0) {
        const { error } = await serviceClient
          .from('organizations')
          .delete()
          .in('id', createdOrganizationIds);
        
        if (!error) {
          console.log(`✅ Cleaned up ${createdOrganizationIds.length} organizations`);
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
        description: 'Test tag for assignment testing',
        created_by: testUser.id
      })
      .select()
      .single();
    
    if (tagError) {
      throw new Error(`Failed to create test tag: ${tagError.message}`);
    }
    
    createdTagIds.push(tagData.id);
    
    // Create a default entity type association since the trigger is removed
    const { error: entityTypeError } = await serviceClient
      .from('tag_entity_types')
      .insert({
        tag_id: tagData.id,
        entity_type: EntityType.ORGANIZATION
      });
    
    if (entityTypeError) {
      console.warn('Failed to create default entity type association:', entityTypeError);
    }
    
    return tagData;
  };

  const createTestOrganization = async (name: string) => {
    const serviceClient = TestClientFactory.getServiceRoleClient();
    
    const { data: orgData, error: orgError } = await serviceClient
      .from('organizations')
      .insert({
        name: `${name} ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Test organization for tag assignment testing'
      })
      .select()
      .single();
    
    if (orgError) {
      throw new Error(`Failed to create test organization: ${orgError.message}`);
    }
    
    createdOrganizationIds.push(orgData.id);
    return orgData;
  };

  describe('Tag Assignment CRUD Operations', () => {
    test('should create tag assignment', async () => {
      const testTag = await createTestTag('AssignmentTest');
      const testOrg = await createTestOrganization('TestOrg');
      
      const result = await tagAssignmentRepo.createTagAssignment({
        tag_id: testTag.id,
        target_id: testOrg.id,
        target_type: EntityType.ORGANIZATION
      });
      
      expect(result.status).toBe('success');
      expect(result.data.tag_id).toBe(testTag.id);
      expect(result.data.target_id).toBe(testOrg.id);
      expect(result.data.target_type).toBe(EntityType.ORGANIZATION);
      
      createdAssignmentIds.push(result.data.id);
    });

    test('should get tag assignments for entity', async () => {
      const testTag1 = await createTestTag('Assignment1');
      const testTag2 = await createTestTag('Assignment2');
      const testOrg = await createTestOrganization('TestOrgAssignments');
      
      // Create multiple assignments for the same entity
      const assignment1 = await tagAssignmentRepo.createTagAssignment({
        tag_id: testTag1.id,
        target_id: testOrg.id,
        target_type: EntityType.ORGANIZATION
      });
      
      const assignment2 = await tagAssignmentRepo.createTagAssignment({
        tag_id: testTag2.id,
        target_id: testOrg.id,
        target_type: EntityType.ORGANIZATION
      });
      
      createdAssignmentIds.push(assignment1.data.id, assignment2.data.id);
      
      const result = await tagAssignmentRepo.getTagAssignmentsForEntity(
        testOrg.id, 
        EntityType.ORGANIZATION
      );
      
      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(2);
      expect(result.data.some(a => a.tag_id === testTag1.id)).toBe(true);
      expect(result.data.some(a => a.tag_id === testTag2.id)).toBe(true);
    });

    test('should get entities with specific tag', async () => {
      const testTag = await createTestTag('EntitySearch');
      const testOrg1 = await createTestOrganization('TestOrg1');
      const testOrg2 = await createTestOrganization('TestOrg2');
      
      // Assign the same tag to multiple entities
      const assignment1 = await tagAssignmentRepo.createTagAssignment({
        tag_id: testTag.id,
        target_id: testOrg1.id,
        target_type: EntityType.ORGANIZATION
      });
      
      const assignment2 = await tagAssignmentRepo.createTagAssignment({
        tag_id: testTag.id,
        target_id: testOrg2.id,
        target_type: EntityType.ORGANIZATION
      });
      
      createdAssignmentIds.push(assignment1.data.id, assignment2.data.id);
      
      const entities = await tagAssignmentRepo.getEntitiesWithTag(
        testTag.id, 
        EntityType.ORGANIZATION
      );
      
      expect(entities).toHaveLength(2);
      expect(entities.some(e => e.target_id === testOrg1.id)).toBe(true);
      expect(entities.some(e => e.target_id === testOrg2.id)).toBe(true);
    });

    test('should get tags for entity', async () => {
      const testTag1 = await createTestTag('EntityTag1');
      const testTag2 = await createTestTag('EntityTag2');
      const testOrg = await createTestOrganization('TestOrgTags');
      
      // Create assignments
      const assignment1 = await tagAssignmentRepo.createTagAssignment({
        tag_id: testTag1.id,
        target_id: testOrg.id,
        target_type: EntityType.ORGANIZATION
      });
      
      const assignment2 = await tagAssignmentRepo.createTagAssignment({
        tag_id: testTag2.id,
        target_id: testOrg.id,
        target_type: EntityType.ORGANIZATION
      });
      
      createdAssignmentIds.push(assignment1.data.id, assignment2.data.id);
      
      const result = await tagAssignmentRepo.getTagsForEntity(
        testOrg.id, 
        EntityType.ORGANIZATION
      );
      
      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(2);
      expect(result.data.some(tag => tag.id === testTag1.id)).toBe(true);
      expect(result.data.some(tag => tag.id === testTag2.id)).toBe(true);
    });

    test('should delete tag assignment', async () => {
      const testTag = await createTestTag('DeleteTest');
      const testOrg = await createTestOrganization('TestOrgDelete');
      
      // Create assignment
      const assignment = await tagAssignmentRepo.createTagAssignment({
        tag_id: testTag.id,
        target_id: testOrg.id,
        target_type: EntityType.ORGANIZATION
      });
      
      // Verify it exists
      let assignments = await tagAssignmentRepo.getTagAssignmentsForEntity(
        testOrg.id, 
        EntityType.ORGANIZATION
      );
      expect(assignments.data).toHaveLength(1);
      
      // Delete assignment
      const deleteResult = await tagAssignmentRepo.deleteTagAssignment(assignment.data.id);
      expect(deleteResult.status).toBe('success');
      expect(deleteResult.data).toBe(true);
      
      // Verify it's deleted
      assignments = await tagAssignmentRepo.getTagAssignmentsForEntity(
        testOrg.id, 
        EntityType.ORGANIZATION
      );
      expect(assignments.data).toHaveLength(0);
    });

    test('should find specific tag assignment', async () => {
      const testTag = await createTestTag('FindTest');
      const testOrg = await createTestOrganization('TestOrgFind');
      
      // Create assignment
      const assignment = await tagAssignmentRepo.createTagAssignment({
        tag_id: testTag.id,
        target_id: testOrg.id,
        target_type: EntityType.ORGANIZATION
      });
      
      createdAssignmentIds.push(assignment.data.id);
      
      // Find the assignment
      const result = await tagAssignmentRepo.findTagAssignment(
        testTag.id,
        testOrg.id,
        EntityType.ORGANIZATION
      );
      
      expect(result.status).toBe('success');
      expect(result.data).not.toBeNull();
      expect(result.data.tag_id).toBe(testTag.id);
      expect(result.data.target_id).toBe(testOrg.id);
    });

    test('should handle undefined parameters gracefully', async () => {
      const assignmentsResult = await tagAssignmentRepo.getTagAssignmentsForEntity(undefined, undefined);
      expect(assignmentsResult.status).toBe('success');
      expect(assignmentsResult.data).toEqual([]);
      
      const tagsResult = await tagAssignmentRepo.getTagsForEntity(undefined, undefined);
      expect(tagsResult.status).toBe('success');
      expect(tagsResult.data).toEqual([]);
      
      const findResult = await tagAssignmentRepo.findTagAssignment(undefined, undefined, undefined);
      expect(findResult.status).toBe('success');
      expect(findResult.data).toBeNull();
      
      const deleteResult = await tagAssignmentRepo.deleteTagAssignment(undefined);
      expect(deleteResult.status).toBe('error');
    });
  });
});
