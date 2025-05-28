
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { PersistentTestUserHelper, PERSISTENT_TEST_USERS } from '../../utils/persistentTestUsers';
import { TestAuthUtils } from '../../utils/testAuthUtils';
import { tagApi, tagAssignmentApi } from '@/api/tags/factory/tagApiFactory';
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
    // Clean up any existing test data first
    await cleanupTestData();
    
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
    return orgData;
  };

  describe('Tag API Operations', () => {
    test('should create a new tag', async () => {
      const tagName = `API Test Tag ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // No need to pass entity type - triggers will handle entity type associations
      // when assignments are created
      const tag = await tagApi.findOrCreate({
        name: tagName,
        description: 'Test tag created via API',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      expect(tag).toBeDefined();
      expect(tag.name).toBe(tagName);
      expect(tag.description).toBe('Test tag created via API');
      
      createdTagIds.push(tag.id);
    });

    test('should get all tags', async () => {
      // Create a test tag first
      const tag = await tagApi.findOrCreate({
        name: `GetAll Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Test tag for getAll operation',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      createdTagIds.push(tag.id);
      
      const tags = await tagApi.getAll(authenticatedClient);
      
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
      expect(tags.some(t => t.id === tag.id)).toBe(true);
    });

    test('should get tag by ID', async () => {
      const tag = await tagApi.findOrCreate({
        name: `GetByID Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Test tag for getById operation',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      createdTagIds.push(tag.id);
      
      const foundTag = await tagApi.getById(tag.id, authenticatedClient);
      
      expect(foundTag).toBeDefined();
      expect(foundTag.id).toBe(tag.id);
      expect(foundTag.name).toBe(tag.name);
    });

    test('should find tag by name', async () => {
      const tagName = `FindByName Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const tag = await tagApi.findOrCreate({
        name: tagName,
        description: 'Test tag for findByName operation',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      createdTagIds.push(tag.id);
      
      const foundTag = await tagApi.findByName(tagName, authenticatedClient);
      
      expect(foundTag).toBeDefined();
      expect(foundTag.name).toBe(tagName);
    });

    test('should search tags', async () => {
      const uniqueSearchTerm = `SearchTest${Date.now()}`;
      
      const tag1 = await tagApi.findOrCreate({
        name: `${uniqueSearchTerm} Tag 1`,
        description: 'First search test tag',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      const tag2 = await tagApi.findOrCreate({
        name: `${uniqueSearchTerm} Tag 2`,
        description: 'Second search test tag',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      createdTagIds.push(tag1.id, tag2.id);
      
      const searchResults = await tagApi.searchByName(uniqueSearchTerm, authenticatedClient);
      
      expect(Array.isArray(searchResults)).toBe(true);
      expect(searchResults.length).toBeGreaterThanOrEqual(2);
      expect(searchResults.some(t => t.id === tag1.id)).toBe(true);
      expect(searchResults.some(t => t.id === tag2.id)).toBe(true);
    });

    test('should find or create tag without entity type parameter', async () => {
      const tagName = `FindOrCreate Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // First call should create the tag (no entity type needed)
      const tag1 = await tagApi.findOrCreate({
        name: tagName,
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      expect(tag1).toBeDefined();
      expect(tag1.name).toBe(tagName);
      
      createdTagIds.push(tag1.id);
      
      // Second call should find the existing tag
      const tag2 = await tagApi.findOrCreate({
        name: tagName,
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      expect(tag2).toBeDefined();
      expect(tag2.id).toBe(tag1.id);
      expect(tag2.name).toBe(tagName);
    });

    test('should update tag', async () => {
      const tag = await tagApi.findOrCreate({
        name: `Update Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Original description',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      createdTagIds.push(tag.id);
      
      const updatedTag = await tagApi.update(tag.id, {
        description: 'Updated description'
      }, authenticatedClient);
      
      expect(updatedTag).toBeDefined();
      expect(updatedTag.id).toBe(tag.id);
      expect(updatedTag.description).toBe('Updated description');
    });

    test('should delete tag', async () => {
      const tag = await tagApi.findOrCreate({
        name: `Delete Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Tag to be deleted',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      const deleteResult = await tagApi.delete(tag.id, authenticatedClient);
      
      expect(deleteResult).toBe(true);
      
      // Verify tag is deleted
      const deletedTag = await tagApi.getById(tag.id, authenticatedClient);
      expect(deletedTag).toBeNull();
    });
  });

  describe('Tag Assignment API Operations', () => {
    test('should automatically create entity type when assignment is made', async () => {
      const tag = await tagApi.findOrCreate({
        name: `Assignment Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Test tag for assignment',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      const org = await createTestOrganization('TestOrgAssignment');
      
      createdTagIds.push(tag.id);
      
      // Create assignment - this should automatically create entity type via trigger
      const assignment = await tagAssignmentApi.create(tag.id, org.id, EntityType.ORGANIZATION, authenticatedClient);
      
      createdAssignmentIds.push(assignment.id);
      
      // Get assignments for entity
      const assignments = await tagAssignmentApi.getForEntity(org.id, EntityType.ORGANIZATION, authenticatedClient);
      
      expect(Array.isArray(assignments)).toBe(true);
      expect(assignments.length).toBe(1);
      expect(assignments[0].tag_id).toBe(tag.id);
      expect(assignments[0].target_id).toBe(org.id);
      
      // Verify that entity type was automatically created by trigger
      const serviceClient = TestClientFactory.getServiceRoleClient();
      const { data: entityTypes } = await serviceClient
        .from('tag_entity_types')
        .select('*')
        .eq('tag_id', tag.id)
        .eq('entity_type', EntityType.ORGANIZATION);
      
      expect(entityTypes).toHaveLength(1);
    });

    test('should create and delete tag assignment', async () => {
      const tag = await tagApi.findOrCreate({
        name: `CreateDelete Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Test tag for create/delete assignment',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      const org = await createTestOrganization('TestOrgCreateDelete');
      
      createdTagIds.push(tag.id);
      
      // Create assignment
      const assignment = await tagAssignmentApi.create(tag.id, org.id, EntityType.ORGANIZATION, authenticatedClient);
      
      expect(assignment).toBeDefined();
      expect(assignment.tag_id).toBe(tag.id);
      expect(assignment.target_id).toBe(org.id);
      
      // Verify assignment exists
      let assignments = await tagAssignmentApi.getForEntity(org.id, EntityType.ORGANIZATION, authenticatedClient);
      expect(assignments.length).toBe(1);
      
      // Delete assignment
      const deleteResult = await tagAssignmentApi.delete(assignment.id, authenticatedClient);
      expect(deleteResult).toBe(true);
      
      // Verify assignment is deleted
      assignments = await tagAssignmentApi.getForEntity(org.id, EntityType.ORGANIZATION, authenticatedClient);
      expect(assignments.length).toBe(0);
    });

    test('should handle multiple assignments to same entity', async () => {
      const tag1 = await tagApi.findOrCreate({
        name: `MultiAssign1 ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'First test tag for multiple assignments',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      const tag2 = await tagApi.findOrCreate({
        name: `MultiAssign2 ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Second test tag for multiple assignments',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      const org = await createTestOrganization('TestOrgMultiAssign');
      
      createdTagIds.push(tag1.id, tag2.id);
      
      // Create multiple assignments for the same entity
      const assignment1 = await tagAssignmentApi.create(tag1.id, org.id, EntityType.ORGANIZATION, authenticatedClient);
      const assignment2 = await tagAssignmentApi.create(tag2.id, org.id, EntityType.ORGANIZATION, authenticatedClient);
      
      createdAssignmentIds.push(assignment1.id, assignment2.id);
      
      // Get all assignments for the entity
      const assignments = await tagAssignmentApi.getForEntity(org.id, EntityType.ORGANIZATION, authenticatedClient);
      
      expect(assignments.length).toBe(2);
      expect(assignments.some(a => a.tag_id === tag1.id)).toBe(true);
      expect(assignments.some(a => a.tag_id === tag2.id)).toBe(true);
    });

    test('should get entities by tag ID', async () => {
      const tag = await tagApi.findOrCreate({
        name: `EntityByTag ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Test tag for finding entities',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      const org1 = await createTestOrganization('TestOrg1');
      const org2 = await createTestOrganization('TestOrg2');
      
      createdTagIds.push(tag.id);
      
      // Assign the same tag to multiple entities
      const assignment1 = await tagAssignmentApi.create(tag.id, org1.id, EntityType.ORGANIZATION, authenticatedClient);
      const assignment2 = await tagAssignmentApi.create(tag.id, org2.id, EntityType.ORGANIZATION, authenticatedClient);
      
      createdAssignmentIds.push(assignment1.id, assignment2.id);
      
      // Get entities with this tag
      const entities = await tagAssignmentApi.getEntitiesByTagId(tag.id, EntityType.ORGANIZATION, authenticatedClient);
      
      expect(entities.length).toBe(2);
      expect(entities.some(e => e.target_id === org1.id)).toBe(true);
      expect(entities.some(e => e.target_id === org2.id)).toBe(true);
    });

    test('should automatically clean up entity types when last assignment is deleted', async () => {
      const tag = await tagApi.findOrCreate({
        name: `CleanupTest ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Test tag for entity type cleanup',
        created_by: testUser.id
      }, undefined, authenticatedClient);
      
      const org1 = await createTestOrganization('TestOrgCleanup1');
      const org2 = await createTestOrganization('TestOrgCleanup2');
      
      createdTagIds.push(tag.id);
      
      // Create assignments with different entity types
      const orgAssignment = await tagAssignmentApi.create(tag.id, org1.id, EntityType.ORGANIZATION, authenticatedClient);
      const profileAssignment = await tagAssignmentApi.create(tag.id, org2.id, EntityType.PROFILE, authenticatedClient);
      
      createdAssignmentIds.push(profileAssignment.id);
      
      // Verify both entity types exist
      const serviceClient = TestClientFactory.getServiceRoleClient();
      let { data: entityTypes } = await serviceClient
        .from('tag_entity_types')
        .select('*')
        .eq('tag_id', tag.id);
      
      expect(entityTypes).toHaveLength(2);
      
      // Delete the organization assignment
      const deleteResult = await tagAssignmentApi.delete(orgAssignment.id, authenticatedClient);
      expect(deleteResult).toBe(true);
      
      // Check if ORGANIZATION entity type was cleaned up (but PROFILE should remain)
      ({ data: entityTypes } = await serviceClient
        .from('tag_entity_types')
        .select('*')
        .eq('tag_id', tag.id));
      
      // Should have 1 entity type left (PROFILE)
      expect(entityTypes).toHaveLength(1);
      expect(entityTypes[0].entity_type).toBe(EntityType.PROFILE);
    });

    test('should handle edge cases gracefully', async () => {
      // Test getting assignments for non-existent entity
      const assignments = await tagAssignmentApi.getForEntity('non-existent-id', EntityType.ORGANIZATION, authenticatedClient);
      expect(assignments).toEqual([]);
      
      // Test getting entities for non-existent tag
      const entities = await tagAssignmentApi.getEntitiesByTagId('non-existent-tag-id', EntityType.ORGANIZATION, authenticatedClient);
      expect(entities).toEqual([]);
      
      // Test deleting non-existent assignment
      const deleteResult = await tagAssignmentApi.delete('non-existent-assignment-id', authenticatedClient);
      expect(deleteResult).toBe(false);
    });
  });
});
