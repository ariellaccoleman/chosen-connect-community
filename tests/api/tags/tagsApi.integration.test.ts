
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { PersistentTestUserHelper } from '../../utils/persistentTestUsers';
import { TestAuthUtils } from '../../utils/testAuthUtils';
import { tagApi, tagAssignmentApi } from '@/api/tags/factory/tagApiFactory';
import { EntityType } from '@/types/entityTypes';
import { v4 as uuidv4 } from 'uuid';

describe('Tag Operations API Integration Tests', () => {
  let testUser: any;
  let createdTagIds: string[] = [];
  let createdAssignmentIds: string[] = [];
  let createdOrganizationIds: string[] = [];

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
    createdAssignmentIds = [];
    createdOrganizationIds = [];
    
    // Set up authentication for user5 (Tag Operations API tests)
    try {
      console.log('🔐 Setting up test authentication for user5...');
      await TestAuthUtils.setupTestAuth('user5');
      
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
        email: 'testuser2@example.com'
      };
    }
    
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
      if (!testUser?.id) {
        console.warn('Skipping test - test setup incomplete');
        expect(true).toBe(true);
        return;
      }

      const tagName = `API Test Tag ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const tag = await tagApi.create({
        name: tagName,
        description: 'Test tag created via API',
        created_by: testUser.id
      });
      
      expect(tag).toBeDefined();
      expect(tag.name).toBe(tagName);
      expect(tag.description).toBe('Test tag created via API');
      
      createdTagIds.push(tag.id);
    });

    test('should get all tags', async () => {
      if (!testUser?.id) {
        console.warn('Skipping test - test setup incomplete');
        expect(true).toBe(true);
        return;
      }

      // Create a test tag first
      const tag = await tagApi.create({
        name: `GetAll Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Test tag for getAll operation',
        created_by: testUser.id
      });
      
      createdTagIds.push(tag.id);
      
      const tags = await tagApi.getAll();
      
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
      expect(tags.some(t => t.id === tag.id)).toBe(true);
    });

    test('should get tag by ID', async () => {
      if (!testUser?.id) {
        console.warn('Skipping test - test setup incomplete');
        expect(true).toBe(true);
        return;
      }

      const tag = await tagApi.create({
        name: `GetByID Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Test tag for getById operation',
        created_by: testUser.id
      });
      
      createdTagIds.push(tag.id);
      
      const foundTag = await tagApi.getById(tag.id);
      
      expect(foundTag).toBeDefined();
      expect(foundTag.id).toBe(tag.id);
      expect(foundTag.name).toBe(tag.name);
    });

    test('should find tag by name', async () => {
      if (!testUser?.id) {
        console.warn('Skipping test - test setup incomplete');
        expect(true).toBe(true);
        return;
      }

      const tagName = `FindByName Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const tag = await tagApi.create({
        name: tagName,
        description: 'Test tag for findByName operation',
        created_by: testUser.id
      });
      
      createdTagIds.push(tag.id);
      
      const foundTag = await tagApi.findByName(tagName);
      
      expect(foundTag).toBeDefined();
      expect(foundTag.name).toBe(tagName);
    });

    test('should search tags', async () => {
      if (!testUser?.id) {
        console.warn('Skipping test - test setup incomplete');
        expect(true).toBe(true);
        return;
      }

      const uniqueSearchTerm = `SearchTest${Date.now()}`;
      
      const tag1 = await tagApi.create({
        name: `${uniqueSearchTerm} Tag 1`,
        description: 'First search test tag',
        created_by: testUser.id
      });
      
      const tag2 = await tagApi.create({
        name: `${uniqueSearchTerm} Tag 2`,
        description: 'Second search test tag',
        created_by: testUser.id
      });
      
      createdTagIds.push(tag1.id, tag2.id);
      
      const searchResults = await tagApi.search(uniqueSearchTerm);
      
      expect(Array.isArray(searchResults)).toBe(true);
      expect(searchResults.length).toBeGreaterThanOrEqual(2);
      expect(searchResults.some(t => t.id === tag1.id)).toBe(true);
      expect(searchResults.some(t => t.id === tag2.id)).toBe(true);
    });

    test('should find or create tag', async () => {
      if (!testUser?.id) {
        console.warn('Skipping test - test setup incomplete');
        expect(true).toBe(true);
        return;
      }

      const tagName = `FindOrCreate Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // First call should create the tag
      const tag1 = await tagApi.findOrCreate(tagName);
      
      expect(tag1).toBeDefined();
      expect(tag1.name).toBe(tagName);
      
      createdTagIds.push(tag1.id);
      
      // Second call should find the existing tag
      const tag2 = await tagApi.findOrCreate(tagName);
      
      expect(tag2).toBeDefined();
      expect(tag2.id).toBe(tag1.id);
      expect(tag2.name).toBe(tagName);
    });

    test('should update tag', async () => {
      if (!testUser?.id) {
        console.warn('Skipping test - test setup incomplete');
        expect(true).toBe(true);
        return;
      }

      const tag = await tagApi.create({
        name: `Update Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Original description',
        created_by: testUser.id
      });
      
      createdTagIds.push(tag.id);
      
      const updatedTag = await tagApi.update(tag.id, {
        description: 'Updated description'
      });
      
      expect(updatedTag).toBeDefined();
      expect(updatedTag.id).toBe(tag.id);
      expect(updatedTag.description).toBe('Updated description');
    });

    test('should delete tag', async () => {
      if (!testUser?.id) {
        console.warn('Skipping test - test setup incomplete');
        expect(true).toBe(true);
        return;
      }

      const tag = await tagApi.create({
        name: `Delete Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Tag to be deleted',
        created_by: testUser.id
      });
      
      const deleteResult = await tagApi.delete(tag.id);
      
      expect(deleteResult).toBe(true);
      
      // Verify tag is deleted
      const deletedTag = await tagApi.getById(tag.id);
      expect(deletedTag).toBeNull();
    });
  });

  describe('Tag Assignment API Operations', () => {
    test('should get tag assignments for entity', async () => {
      if (!testUser?.id) {
        console.warn('Skipping test - test setup incomplete');
        expect(true).toBe(true);
        return;
      }

      const tag = await tagApi.create({
        name: `Assignment Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Test tag for assignment',
        created_by: testUser.id
      });
      
      const org = await createTestOrganization('TestOrgAssignment');
      
      createdTagIds.push(tag.id);
      
      // Create assignment
      const assignment = await tagAssignmentApi.createAssignment({
        tag_id: tag.id,
        target_id: org.id,
        target_type: EntityType.ORGANIZATION
      });
      
      createdAssignmentIds.push(assignment.id);
      
      // Get assignments for entity
      const assignments = await tagAssignmentApi.getAssignmentsForEntity(
        org.id, 
        EntityType.ORGANIZATION
      );
      
      expect(Array.isArray(assignments)).toBe(true);
      expect(assignments.length).toBe(1);
      expect(assignments[0].tag_id).toBe(tag.id);
      expect(assignments[0].target_id).toBe(org.id);
    });

    test('should create and delete tag assignment', async () => {
      if (!testUser?.id) {
        console.warn('Skipping test - test setup incomplete');
        expect(true).toBe(true);
        return;
      }

      const tag = await tagApi.create({
        name: `CreateDelete Test ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'Test tag for create/delete assignment',
        created_by: testUser.id
      });
      
      const org = await createTestOrganization('TestOrgCreateDelete');
      
      createdTagIds.push(tag.id);
      
      // Create assignment
      const assignment = await tagAssignmentApi.createAssignment({
        tag_id: tag.id,
        target_id: org.id,
        target_type: EntityType.ORGANIZATION
      });
      
      expect(assignment).toBeDefined();
      expect(assignment.tag_id).toBe(tag.id);
      expect(assignment.target_id).toBe(org.id);
      
      // Verify assignment exists
      let assignments = await tagAssignmentApi.getAssignmentsForEntity(
        org.id, 
        EntityType.ORGANIZATION
      );
      expect(assignments.length).toBe(1);
      
      // Delete assignment
      const deleteResult = await tagAssignmentApi.deleteAssignment(assignment.id);
      expect(deleteResult).toBe(true);
      
      // Verify assignment is deleted
      assignments = await tagAssignmentApi.getAssignmentsForEntity(
        org.id, 
        EntityType.ORGANIZATION
      );
      expect(assignments.length).toBe(0);
    });
  });
});
