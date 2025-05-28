
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { PersistentTestUserHelper, PERSISTENT_TEST_USERS } from '../../utils/persistentTestUsers';
import { TestAuthUtils } from '../../utils/testAuthUtils';
import { extendedTagApi, tagAssignmentApi } from '@/api/tags/factory/tagApiFactory';
import { EntityType } from '@/types/entityTypes';

describe('Tag Operations API Integration Tests', () => {
  let testUser: any;
  let authenticatedClient: any;
  let createdTagIds: string[] = [];
  let createdAssignmentIds: string[] = [];
  let createdOrganizationIds: string[] = [];
  const testUserEmail = PERSISTENT_TEST_USERS.user5.email;

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
    // Clean up any existing test data for THIS USER ONLY
    await userScopedCleanup();
    
    // Reset tracking arrays AFTER cleanup
    createdTagIds = [];
    createdAssignmentIds = [];
    createdOrganizationIds = [];
    
    // Set up authentication using user5 for Tag Operations API tests
    console.log('🔐 Setting up test authentication for user5...');
    const authResult = await TestAuthUtils.setupTestAuth('user5');
    testUser = authResult.user;
    authenticatedClient = authResult.client;
    
    if (!testUser?.id) {
      throw new Error('❌ Test user setup failed - no user returned');
    }
    
    console.log(`✅ Test user authenticated: ${testUser.email}`);
    
    // Set up test data ONLY after confirmed authentication
    await setupTestData();
  });

  afterEach(async () => {
    await userScopedCleanup();
    await TestAuthUtils.cleanupTestAuth(testUserEmail);
  });

  afterAll(() => {
    TestClientFactory.cleanup();
  });

  const userScopedCleanup = async () => {
    try {
      const serviceClient = TestClientFactory.getServiceRoleClient();
      
      console.log('🧹 Starting user-scoped cleanup for user5...');
      
      // Get user5's profile ID for scoped cleanup
      const { data: userProfile } = await serviceClient
        .from('profiles')
        .select('id')
        .eq('email', testUserEmail)
        .single();
      
      if (!userProfile) {
        console.log('ℹ️ No profile found for user5, skipping cleanup');
        return;
      }
      
      const userId = userProfile.id;
      
      // Clean up tag assignments for tags created by THIS USER ONLY
      const { data: userTags } = await serviceClient
        .from('tags')
        .select('id')
        .eq('created_by', userId);
      
      if (userTags && userTags.length > 0) {
        const userTagIds = userTags.map(tag => tag.id);
        
        // Delete assignments for THIS USER's tags only
        const { error: assignmentError } = await serviceClient
          .from('tag_assignments')
          .delete()
          .in('tag_id', userTagIds);
        
        if (!assignmentError) {
          console.log(`✅ Cleaned up assignments for ${userTagIds.length} user5 tags`);
        }
      }
      
      // Clean up tracked assignments (belt and suspenders)
      if (createdAssignmentIds.length > 0) {
        const { error } = await serviceClient
          .from('tag_assignments')
          .delete()
          .in('id', createdAssignmentIds);
        
        if (!error) {
          console.log(`✅ Cleaned up ${createdAssignmentIds.length} tracked tag assignments`);
        }
      }
      
      // Clean up organizations created during tests (tracked ones)
      if (createdOrganizationIds.length > 0) {
        const { error } = await serviceClient
          .from('organizations')
          .delete()
          .in('id', createdOrganizationIds);
        
        if (!error) {
          console.log(`✅ Cleaned up ${createdOrganizationIds.length} organizations`);
        }
      }
      
      // Clean up tags created by THIS USER ONLY
      const { error: userTagsError } = await serviceClient
        .from('tags')
        .delete()
        .eq('created_by', userId);
      
      if (!userTagsError) {
        console.log('✅ Cleaned up all tags created by user5');
      }
      
      // Clean up tracked tags (belt and suspenders)
      if (createdTagIds.length > 0) {
        const { error } = await serviceClient
          .from('tags')
          .delete()
          .in('id', createdTagIds);
        
        if (!error) {
          console.log(`✅ Cleaned up ${createdTagIds.length} tracked tags`);
        }
      }
      
      console.log('✅ User-scoped cleanup completed for user5');
      
    } catch (error) {
      console.warn('⚠️ User-scoped cleanup warning:', error);
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

  const createTestOrganization = async (name: string) => {
    const serviceClient = TestClientFactory.getServiceRoleClient();
    
    const { data: orgData, error: orgError } = await serviceClient
      .from('organizations')
      .insert({
        name: `${name} ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Test organization for tag API testing'
      })
      .select()
      .single();
    
    if (orgError) {
      throw new Error(`Failed to create test organization: ${orgError.message}`);
    }
    
    createdOrganizationIds.push(orgData.id);
    console.log(`📝 Tracking organization for cleanup: ${orgData.id}`);
    return orgData;
  };

  describe('Tag API Operations', () => {
    test('should create a new tag', async () => {
      const tagName = `API Test Tag ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await extendedTagApi.findOrCreate({
        name: tagName,
        description: 'Test tag created via API',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      expect(response.error).toBeNull();
      expect(response.data).toBeDefined();
      expect(response.data).not.toBeNull();
      
      const tag = response.data!;
      expect(tag.name).toBe(tagName);
      expect(tag.description).toBe('Test tag created via API');
      
      createdTagIds.push(tag.id);
      console.log(`📝 Tracking tag for cleanup: ${tag.id}`);
    });

    test('should get all tags', async () => {
      const createResponse = await extendedTagApi.findOrCreate({
        name: `GetAll Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Test tag for getAll operation',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      expect(createResponse.error).toBeNull();
      expect(createResponse.data).toBeDefined();
      expect(createResponse.data).not.toBeNull();
      
      const tag = createResponse.data!;
      createdTagIds.push(tag.id);
      console.log(`📝 Tracking tag for cleanup: ${tag.id}`);
      
      const getAllResponse = await extendedTagApi.getAll(authenticatedClient);
      
      expect(getAllResponse.error).toBeNull();
      expect(getAllResponse.data).toBeDefined();
      expect(getAllResponse.data).not.toBeNull();
      
      const tags = getAllResponse.data!;
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
      expect(tags.some(t => t.id === tag.id)).toBe(true);
    });

    test('should get tag by ID', async () => {
      const createResponse = await extendedTagApi.findOrCreate({
        name: `GetByID Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Test tag for getById operation',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      expect(createResponse.error).toBeNull();
      expect(createResponse.data).toBeDefined();
      expect(createResponse.data).not.toBeNull();
      
      const tag = createResponse.data!;
      createdTagIds.push(tag.id);
      console.log(`📝 Tracking tag for cleanup: ${tag.id}`);
      
      const getByIdResponse = await extendedTagApi.getById(tag.id, authenticatedClient);
      
      expect(getByIdResponse.error).toBeNull();
      expect(getByIdResponse.data).toBeDefined();
      expect(getByIdResponse.data).not.toBeNull();
      
      const foundTag = getByIdResponse.data!;
      expect(foundTag.id).toBe(tag.id);
      expect(foundTag.name).toBe(tag.name);
    });

    test('should find tag by name', async () => {
      const tagName = `FindByName Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const createResponse = await extendedTagApi.findOrCreate({
        name: tagName,
        description: 'Test tag for findByName operation',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      expect(createResponse.error).toBeNull();
      expect(createResponse.data).toBeDefined();
      expect(createResponse.data).not.toBeNull();
      
      const tag = createResponse.data!;
      createdTagIds.push(tag.id);
      console.log(`📝 Tracking tag for cleanup: ${tag.id}`);
      
      const findByNameResponse = await extendedTagApi.findByName(tagName, authenticatedClient);
      
      expect(findByNameResponse.error).toBeNull();
      expect(findByNameResponse.data).toBeDefined();
      expect(findByNameResponse.data).not.toBeNull();
      
      const foundTag = findByNameResponse.data!;
      expect(foundTag.name).toBe(tagName);
    });

    test('should search tags', async () => {
      const uniqueSearchTerm = `SearchTest${Date.now()}`;
      
      const createResponse1 = await extendedTagApi.findOrCreate({
        name: `${uniqueSearchTerm} Tag 1`,
        description: 'First search test tag',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      const createResponse2 = await extendedTagApi.findOrCreate({
        name: `${uniqueSearchTerm} Tag 2`,
        description: 'Second search test tag',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      expect(createResponse1.error).toBeNull();
      expect(createResponse2.error).toBeNull();
      expect(createResponse1.data).toBeDefined();
      expect(createResponse2.data).toBeDefined();
      expect(createResponse1.data).not.toBeNull();
      expect(createResponse2.data).not.toBeNull();
      
      const tag1 = createResponse1.data!;
      const tag2 = createResponse2.data!;
      
      createdTagIds.push(tag1.id, tag2.id);
      console.log(`📝 Tracking tags for cleanup: ${tag1.id}, ${tag2.id}`);
      
      const searchResponse = await extendedTagApi.searchByName(uniqueSearchTerm, authenticatedClient);
      
      expect(searchResponse.error).toBeNull();
      expect(searchResponse.data).toBeDefined();
      expect(searchResponse.data).not.toBeNull();
      
      const searchResults = searchResponse.data!;
      expect(Array.isArray(searchResults)).toBe(true);
      expect(searchResults.length).toBeGreaterThanOrEqual(2);
      expect(searchResults.some(t => t.id === tag1.id)).toBe(true);
      expect(searchResults.some(t => t.id === tag2.id)).toBe(true);
    });

    test('should find or create tag without entity type parameter', async () => {
      const tagName = `FindOrCreate Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const createResponse1 = await extendedTagApi.findOrCreate({
        name: tagName,
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      expect(createResponse1.error).toBeNull();
      expect(createResponse1.data).toBeDefined();
      expect(createResponse1.data).not.toBeNull();
      
      const tag1 = createResponse1.data!;
      expect(tag1.name).toBe(tagName);
      
      createdTagIds.push(tag1.id);
      console.log(`📝 Tracking tag for cleanup: ${tag1.id}`);
      
      const createResponse2 = await extendedTagApi.findOrCreate({
        name: tagName,
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      expect(createResponse2.error).toBeNull();
      expect(createResponse2.data).toBeDefined();
      expect(createResponse2.data).not.toBeNull();
      
      const tag2 = createResponse2.data!;
      expect(tag2.id).toBe(tag1.id);
      expect(tag2.name).toBe(tagName);
    });

    test('should update tag', async () => {
      const createResponse = await extendedTagApi.findOrCreate({
        name: `Update Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Original description',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      expect(createResponse.error).toBeNull();
      expect(createResponse.data).toBeDefined();
      expect(createResponse.data).not.toBeNull();
      
      const tag = createResponse.data!;
      createdTagIds.push(tag.id);
      console.log(`📝 Tracking tag for cleanup: ${tag.id}`);
      
      const updateResponse = await extendedTagApi.update(tag.id, {
        description: 'Updated description'
      }, authenticatedClient);
      
      expect(updateResponse.error).toBeNull();
      expect(updateResponse.data).toBeDefined();
      expect(updateResponse.data).not.toBeNull();
      
      const updatedTag = updateResponse.data!;
      expect(updatedTag.id).toBe(tag.id);
      expect(updatedTag.description).toBe('Updated description');
    });

    test('should delete tag', async () => {
      const createResponse = await extendedTagApi.findOrCreate({
        name: `Delete Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Tag to be deleted',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      expect(createResponse.error).toBeNull();
      expect(createResponse.data).toBeDefined();
      expect(createResponse.data).not.toBeNull();
      
      const tag = createResponse.data!;
      // Don't add to cleanup array since we're testing deletion
      console.log(`🗑️ Testing deletion of tag: ${tag.id}`);
      
      const deleteResponse = await extendedTagApi.delete(tag.id, authenticatedClient);
      
      expect(deleteResponse.error).toBeNull();
      expect(deleteResponse.data).toBe(true);
      
      const getDeletedResponse = await extendedTagApi.getById(tag.id, authenticatedClient);
      expect(getDeletedResponse.error).toBeNull();
      expect(getDeletedResponse.data).toBeNull();
    });
  });

  describe('Tag Assignment API Operations', () => {
    test('should automatically create entity type when assignment is made', async () => {
      const createTagResponse = await extendedTagApi.findOrCreate({
        name: `Assignment Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Test tag for assignment',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      expect(createTagResponse.error).toBeNull();
      expect(createTagResponse.data).toBeDefined();
      expect(createTagResponse.data).not.toBeNull();
      
      const tag = createTagResponse.data!;
      const org = await createTestOrganization('TestOrgAssignment');
      
      createdTagIds.push(tag.id);
      console.log(`📝 Tracking tag for cleanup: ${tag.id}`);
      
      const assignmentResponse = await tagAssignmentApi.create(tag.id, org.id, EntityType.ORGANIZATION, authenticatedClient);
      
      expect(assignmentResponse.error).toBeNull();
      expect(assignmentResponse.data).toBeDefined();
      expect(assignmentResponse.data).not.toBeNull();
      
      const assignment = assignmentResponse.data!;
      createdAssignmentIds.push(assignment.id);
      console.log(`📝 Tracking assignment for cleanup: ${assignment.id}`);
      
      const getAssignmentsResponse = await tagAssignmentApi.getForEntity(org.id, EntityType.ORGANIZATION, authenticatedClient);
      
      expect(getAssignmentsResponse.error).toBeNull();
      expect(getAssignmentsResponse.data).toBeDefined();
      expect(getAssignmentsResponse.data).not.toBeNull();
      
      const assignments = getAssignmentsResponse.data!;
      expect(Array.isArray(assignments)).toBe(true);
      expect(assignments.length).toBe(1);
      expect(assignments[0].tag_id).toBe(tag.id);
      expect(assignments[0].target_id).toBe(org.id);
      
      const serviceClient = TestClientFactory.getServiceRoleClient();
      const { data: entityTypes } = await serviceClient
        .from('tag_entity_types')
        .select('*')
        .eq('tag_id', tag.id)
        .eq('entity_type', EntityType.ORGANIZATION);
      
      expect(entityTypes).toHaveLength(1);
    });

    test('should create and delete tag assignment', async () => {
      const createTagResponse = await extendedTagApi.findOrCreate({
        name: `CreateDelete Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Test tag for create/delete assignment',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      expect(createTagResponse.error).toBeNull();
      expect(createTagResponse.data).toBeDefined();
      expect(createTagResponse.data).not.toBeNull();
      
      const tag = createTagResponse.data!;
      const org = await createTestOrganization('TestOrgCreateDelete');
      
      createdTagIds.push(tag.id);
      console.log(`📝 Tracking tag for cleanup: ${tag.id}`);
      
      const createAssignmentResponse = await tagAssignmentApi.create(tag.id, org.id, EntityType.ORGANIZATION, authenticatedClient);
      
      expect(createAssignmentResponse.error).toBeNull();
      expect(createAssignmentResponse.data).toBeDefined();
      expect(createAssignmentResponse.data).not.toBeNull();
      
      const assignment = createAssignmentResponse.data!;
      expect(assignment.tag_id).toBe(tag.id);
      expect(assignment.target_id).toBe(org.id);
      
      let getAssignmentsResponse = await tagAssignmentApi.getForEntity(org.id, EntityType.ORGANIZATION, authenticatedClient);
      expect(getAssignmentsResponse.error).toBeNull();
      expect(getAssignmentsResponse.data).toBeDefined();
      expect(getAssignmentsResponse.data).not.toBeNull();
      
      let assignments = getAssignmentsResponse.data!;
      expect(assignments.length).toBe(1);
      
      const deleteResponse = await tagAssignmentApi.delete(assignment.id, authenticatedClient);
      expect(deleteResponse.error).toBeNull();
      expect(deleteResponse.data).toBe(true);
      
      getAssignmentsResponse = await tagAssignmentApi.getForEntity(org.id, EntityType.ORGANIZATION, authenticatedClient);
      expect(getAssignmentsResponse.error).toBeNull();
      expect(getAssignmentsResponse.data).toBeDefined();
      expect(getAssignmentsResponse.data).not.toBeNull();
      
      assignments = getAssignmentsResponse.data!;
      expect(assignments.length).toBe(0);
    });

    test('should handle multiple assignments to same entity', async () => {
      const createTag1Response = await extendedTagApi.findOrCreate({
        name: `MultiAssign1 ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'First test tag for multiple assignments',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      const createTag2Response = await extendedTagApi.findOrCreate({
        name: `MultiAssign2 ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Second test tag for multiple assignments',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      expect(createTag1Response.error).toBeNull();
      expect(createTag2Response.error).toBeNull();
      expect(createTag1Response.data).toBeDefined();
      expect(createTag2Response.data).toBeDefined();
      expect(createTag1Response.data).not.toBeNull();
      expect(createTag2Response.data).not.toBeNull();
      
      const tag1 = createTag1Response.data!;
      const tag2 = createTag2Response.data!;
      const org = await createTestOrganization('TestOrgMultiAssign');
      
      createdTagIds.push(tag1.id, tag2.id);
      console.log(`📝 Tracking tags for cleanup: ${tag1.id}, ${tag2.id}`);
      
      const assignment1Response = await tagAssignmentApi.create(tag1.id, org.id, EntityType.ORGANIZATION, authenticatedClient);
      const assignment2Response = await tagAssignmentApi.create(tag2.id, org.id, EntityType.ORGANIZATION, authenticatedClient);
      
      expect(assignment1Response.error).toBeNull();
      expect(assignment2Response.error).toBeNull();
      expect(assignment1Response.data).toBeDefined();
      expect(assignment2Response.data).toBeDefined();
      expect(assignment1Response.data).not.toBeNull();
      expect(assignment2Response.data).not.toBeNull();
      
      const assignment1 = assignment1Response.data!;
      const assignment2 = assignment2Response.data!;
      
      createdAssignmentIds.push(assignment1.id, assignment2.id);
      console.log(`📝 Tracking assignments for cleanup: ${assignment1.id}, ${assignment2.id}`);
      
      const getAssignmentsResponse = await tagAssignmentApi.getForEntity(org.id, EntityType.ORGANIZATION, authenticatedClient);
      
      expect(getAssignmentsResponse.error).toBeNull();
      expect(getAssignmentsResponse.data).toBeDefined();
      expect(getAssignmentsResponse.data).not.toBeNull();
      
      const assignments = getAssignmentsResponse.data!;
      expect(assignments.length).toBe(2);
      expect(assignments.some(a => a.tag_id === tag1.id)).toBe(true);
      expect(assignments.some(a => a.tag_id === tag2.id)).toBe(true);
    });

    test('should get entities by tag ID', async () => {
      const createTagResponse = await extendedTagApi.findOrCreate({
        name: `EntityByTag ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Test tag for finding entities',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      expect(createTagResponse.error).toBeNull();
      expect(createTagResponse.data).toBeDefined();
      expect(createTagResponse.data).not.toBeNull();
      
      const tag = createTagResponse.data!;
      const org1 = await createTestOrganization('TestOrg1');
      const org2 = await createTestOrganization('TestOrg2');
      
      createdTagIds.push(tag.id);
      console.log(`📝 Tracking tag for cleanup: ${tag.id}`);
      
      const assignment1Response = await tagAssignmentApi.create(tag.id, org1.id, EntityType.ORGANIZATION, authenticatedClient);
      const assignment2Response = await tagAssignmentApi.create(tag.id, org2.id, EntityType.ORGANIZATION, authenticatedClient);
      
      expect(assignment1Response.error).toBeNull();
      expect(assignment2Response.error).toBeNull();
      expect(assignment1Response.data).toBeDefined();
      expect(assignment2Response.data).toBeDefined();
      expect(assignment1Response.data).not.toBeNull();
      expect(assignment2Response.data).not.toBeNull();
      
      const assignment1 = assignment1Response.data!;
      const assignment2 = assignment2Response.data!;
      
      createdAssignmentIds.push(assignment1.id, assignment2.id);
      console.log(`📝 Tracking assignments for cleanup: ${assignment1.id}, ${assignment2.id}`);
      
      const getEntitiesResponse = await tagAssignmentApi.getEntitiesByTagId(tag.id, EntityType.ORGANIZATION, authenticatedClient);
      
      expect(getEntitiesResponse.error).toBeNull();
      expect(getEntitiesResponse.data).toBeDefined();
      expect(getEntitiesResponse.data).not.toBeNull();
      
      const entities = getEntitiesResponse.data!;
      expect(entities.length).toBe(2);
      expect(entities.some(e => e.target_id === org1.id)).toBe(true);
      expect(entities.some(e => e.target_id === org2.id)).toBe(true);
    });

    test('should automatically clean up entity types when last assignment is deleted', async () => {
      const createTagResponse = await extendedTagApi.findOrCreate({
        name: `CleanupTest ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Test tag for entity type cleanup',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      expect(createTagResponse.error).toBeNull();
      expect(createTagResponse.data).toBeDefined();
      expect(createTagResponse.data).not.toBeNull();
      
      const tag = createTagResponse.data!;
      const org1 = await createTestOrganization('TestOrgCleanup1');
      const org2 = await createTestOrganization('TestOrgCleanup2');
      
      createdTagIds.push(tag.id);
      console.log(`📝 Tracking tag for cleanup: ${tag.id}`);
      
      const orgAssignmentResponse = await tagAssignmentApi.create(tag.id, org1.id, EntityType.ORGANIZATION, authenticatedClient);
      const personAssignmentResponse = await tagAssignmentApi.create(tag.id, org2.id, EntityType.PERSON, authenticatedClient);
      
      expect(orgAssignmentResponse.error).toBeNull();
      expect(personAssignmentResponse.error).toBeNull();
      expect(orgAssignmentResponse.data).toBeDefined();
      expect(personAssignmentResponse.data).toBeDefined();
      expect(orgAssignmentResponse.data).not.toBeNull();
      expect(personAssignmentResponse.data).not.toBeNull();
      
      const orgAssignment = orgAssignmentResponse.data!;
      const personAssignment = personAssignmentResponse.data!;
      
      createdAssignmentIds.push(personAssignment.id);
      console.log(`📝 Tracking assignment for cleanup: ${personAssignment.id}`);
      
      const serviceClient = TestClientFactory.getServiceRoleClient();
      let { data: entityTypes } = await serviceClient
        .from('tag_entity_types')
        .select('*')
        .eq('tag_id', tag.id);
      
      expect(entityTypes).toHaveLength(2);
      
      const deleteResponse = await tagAssignmentApi.delete(orgAssignment.id, authenticatedClient);
      expect(deleteResponse.error).toBeNull();
      expect(deleteResponse.data).toBe(true);
      
      ({ data: entityTypes } = await serviceClient
        .from('tag_entity_types')
        .select('*')
        .eq('tag_id', tag.id));
      
      expect(entityTypes).toHaveLength(1);
      expect(entityTypes![0].entity_type).toBe(EntityType.PERSON);
    });

    test('should handle edge cases gracefully', async () => {
      const getAssignmentsResponse = await tagAssignmentApi.getForEntity('non-existent-id', EntityType.ORGANIZATION, authenticatedClient);
      expect(getAssignmentsResponse.error).toBeNull();
      expect(getAssignmentsResponse.data).toEqual([]);
      
      const getEntitiesResponse = await tagAssignmentApi.getEntitiesByTagId('non-existent-tag-id', EntityType.ORGANIZATION, authenticatedClient);
      expect(getEntitiesResponse.error).toBeNull();
      expect(getEntitiesResponse.data).toEqual([]);
      
      const deleteResponse = await tagAssignmentApi.delete('non-existent-assignment-id', authenticatedClient);
      expect(deleteResponse.error).toBeNull();
      expect(deleteResponse.data).toBe(false);
    });
  });
});
