import { organizationRelationshipsApi } from '@/api/organizations/relationshipsApi';
import { TestClientFactory, TestInfrastructure } from '@/integrations/supabase/testClient';
import { PersistentTestUserHelper, PERSISTENT_TEST_USERS } from '../../utils/persistentTestUsers';
import { TestAuthUtils } from '../../utils/testAuthUtils';
import { ProfileOrganizationRelationship } from '@/types';
import { v4 as uuidv4 } from 'uuid';

describe.skip('Organization Relationships API - Database Tests', () => {
  let testUser: any;
  let testOrganization: any;
  let authenticatedClient: any;
  let createdRelationshipIds: string[] = [];
  let createdOrganizationIds: string[] = [];
  let testOrgName: string;
  const testUserEmail = PERSISTENT_TEST_USERS.user1.email;
  
  beforeAll(async () => {
    // Verify test users are set up
    const isSetup = await PersistentTestUserHelper.verifyTestUsersSetup();
    if (!isSetup) {
      console.warn('⚠️ Persistent test users not set up - some tests may fail');
    }
  });

  beforeEach(async () => {
    try {
      // Clean up any existing test data first
      await cleanupTestData();
      
      // Set up authentication for the main client
      console.log('🔐 Setting up test authentication...');
      const authResult = await TestAuthUtils.setupTestAuth('user1');
      testUser = authResult.user;
      authenticatedClient = authResult.client;
      
      console.log('✅ Test user authenticated:', testUser.id, testUser.email);
      
      // Create a test organization using service client (for setup only)
      const serviceClient = TestClientFactory.getServiceRoleClient();
      
      // Ensure profile exists first - use service client to bypass RLS
      const { error: profileError } = await serviceClient
        .from('profiles')
        .upsert({ 
          id: testUser.id, 
          email: testUser.email || testUserEmail,
          first_name: 'Test',
          last_name: 'User'
        }, {
          onConflict: 'id'
        });
      
      if (profileError) {
        console.warn('Profile creation warning:', profileError);
      }
      
      // Create a unique test organization for this test
      testOrgName = `Test Organization ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const { data: orgData, error: orgError } = await serviceClient
        .from('organizations')
        .insert({
          name: testOrgName,
          description: 'A test organization for database tests'
        })
        .select()
        .single();
      
      if (orgError) {
        console.error('Failed to create test organization:', orgError);
        throw orgError;
      }
      
      testOrganization = orgData;
      createdOrganizationIds.push(orgData.id);
      console.log('✅ Test setup complete with unique organization:', testOrgName);
      
      // Reset tracking arrays AFTER successful setup
      createdRelationshipIds = [];
    } catch (error) {
      console.error('❌ Test setup failed:', error);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      await cleanupTestData();
      
      // Clean up test authentication
      await TestAuthUtils.cleanupTestAuth(testUserEmail);
      console.log('✅ Test cleanup complete');
    } catch (error) {
      console.error('❌ Test cleanup failed:', error);
    }
  });

  afterAll(async () => {
    // Ensure we clean up all clients
    await TestClientFactory.cleanup();
  });

  const cleanupTestData = async () => {
    try {
      const serviceClient = TestClientFactory.getServiceRoleClient();
      
      // Clean up relationships by IDs if we have them
      if (createdRelationshipIds.length > 0) {
        try {
          const { error: relError } = await serviceClient
            .from('org_relationships')
            .delete()
            .in('id', createdRelationshipIds);
          
          if (relError) {
            console.warn('Warning cleaning up relationships by ID:', relError.message);
          } else {
            console.log(`✅ Cleaned up ${createdRelationshipIds.length} relationships by ID`);
          }
        } catch (error) {
          console.warn('Error cleaning up relationships by ID:', error);
        }
      }
      
      // Clean up organizations by IDs if we have them
      if (createdOrganizationIds.length > 0) {
        try {
          const { error: orgError } = await serviceClient
            .from('organizations')
            .delete()
            .in('id', createdOrganizationIds);
          
          if (orgError) {
            console.warn('Warning cleaning up organizations by ID:', orgError.message);
          } else {
            console.log(`✅ Cleaned up ${createdOrganizationIds.length} organizations by ID`);
          }
        } catch (error) {
          console.warn('Error cleaning up organizations by ID:', error);
        }
      }
      
      // Fallback cleanup: Clean up any relationships for this test user
      if (testUser?.id) {
        try {
          const { error: userRelError } = await serviceClient
            .from('org_relationships')
            .delete()
            .eq('profile_id', testUser.id);
          
          if (userRelError) {
            console.warn('Warning cleaning up user relationships:', userRelError.message);
          } else {
            console.log(`✅ Cleaned up relationships for user: ${testUser.id}`);
          }
        } catch (error) {
          console.warn('Error cleaning up user relationships:', error);
        }
      }
      
      // Fallback cleanup: Clean up test organizations by name pattern
      if (testOrgName) {
        try {
          const { error: nameOrgError } = await serviceClient
            .from('organizations')
            .delete()
            .eq('name', testOrgName);
          
          if (nameOrgError) {
            console.warn('Warning cleaning up organization by name:', nameOrgError.message);
          } else {
            console.log(`✅ Cleaned up organization by name: ${testOrgName}`);
          }
        } catch (error) {
          console.warn('Error cleaning up organization by name:', error);
        }
      }
      
      // Broad cleanup: Clean up any test organizations that might be left over
      try {
        const { error: broadOrgError } = await serviceClient
          .from('organizations')
          .delete()
          .like('name', 'Test Organization %');
        
        if (broadOrgError) {
          console.warn('Warning in broad organization cleanup:', broadOrgError.message);
        } else {
          console.log('✅ Completed broad cleanup of test organizations');
        }
      } catch (error) {
        console.warn('Error in broad organization cleanup:', error);
      }
      
    } catch (error) {
      console.warn('General cleanup warning:', error);
    }
  };

  describe('getUserOrganizationRelationships', () => {
    test('should return empty array when user has no relationships', async () => {
      console.log('🧪 Testing getUserOrganizationRelationships with no relationships');
      const result = await organizationRelationshipsApi.getUserOrganizationRelationships(testUser.id, authenticatedClient);
      
      expect(result.status).toBe('success');
      expect(result.data).toEqual([]);
    });

    test('should return user relationships with organization details', async () => {
      console.log('🧪 Testing getUserOrganizationRelationships with existing relationship');
      
      // Create a test relationship directly in database using service client
      const serviceClient = TestClientFactory.getServiceRoleClient();
      
      const { data: relationshipData, error: relationshipError } = await serviceClient
        .from('org_relationships')
        .insert({
          profile_id: testUser.id,
          organization_id: testOrganization.id,
          connection_type: 'current',
          department: 'Engineering',
          notes: 'Test relationship'
        })
        .select('id')
        .single();
      
      expect(relationshipError).toBeNull();
      if (relationshipData) {
        createdRelationshipIds.push(relationshipData.id);
      }
      
      // Test the API using the authenticated client
      const result = await organizationRelationshipsApi.getUserOrganizationRelationships(testUser.id, authenticatedClient);
      
      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        profile_id: testUser.id,
        organization_id: testOrganization.id,
        connection_type: 'current',
        department: 'Engineering',
        notes: 'Test relationship'
      });
      expect(result.data[0].organization).toBeDefined();
      expect(result.data[0].organization.name).toBe(testOrganization.name);
    });

    test('should handle invalid UUID format gracefully', async () => {
      console.log('🧪 Testing getUserOrganizationRelationships with invalid UUID');
      const result = await organizationRelationshipsApi.getUserOrganizationRelationships('not-a-valid-uuid', authenticatedClient);
      
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });
  });

  describe('addOrganizationRelationship', () => {
    test('should create a new relationship successfully', async () => {
      console.log('🧪 Testing addOrganizationRelationship');
      
      const relationshipData = {
        profile_id: testUser.id,
        organization_id: testOrganization.id,
        connection_type: 'current' as const,
        department: 'Engineering',
        notes: 'New relationship'
      };

      console.log('🔍 Calling addOrganizationRelationship with data:', relationshipData);
      
      // API call using the authenticated client
      const result = await organizationRelationshipsApi.addOrganizationRelationship(relationshipData, authenticatedClient);
      
      console.log('🔍 API Response:', {
        status: result.status,
        data: result.data,
        error: result.error
      });
      
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
      
      // Verify the relationship was created in the database using service client
      const serviceClient = TestClientFactory.getServiceRoleClient();
      const { data: relationships, error } = await serviceClient
        .from('org_relationships')
        .select('*')
        .eq('profile_id', testUser.id)
        .eq('organization_id', testOrganization.id);
      
      expect(error).toBeNull();
      expect(relationships).toHaveLength(1);
      expect(relationships[0]).toMatchObject({
        profile_id: testUser.id,
        organization_id: testOrganization.id,
        connection_type: 'current',
        department: 'Engineering',
        notes: 'New relationship'
      });
      
      // Track the created relationship for cleanup
      if (relationships[0]) {
        createdRelationshipIds.push(relationships[0].id);
      }
    });

    test('should handle missing profile_id', async () => {
      console.log('🧪 Testing addOrganizationRelationship with missing profile_id');
      
      const relationshipData = {
        organization_id: testOrganization.id,
        connection_type: 'current' as const
      } as any;

      const result = await organizationRelationshipsApi.addOrganizationRelationship(relationshipData, authenticatedClient);
      
      expect(result.status).toBe('error');
      expect(result.error.message).toContain('Profile ID is required');
    });

    test('should handle non-existent organization', async () => {
      console.log('🧪 Testing addOrganizationRelationship with non-existent organization');
      
      const relationshipData = {
        profile_id: testUser.id,
        organization_id: uuidv4(),
        connection_type: 'current' as const,
        department: 'Engineering'
      };

      const result = await organizationRelationshipsApi.addOrganizationRelationship(relationshipData, authenticatedClient);
      
      // Should fail due to foreign key constraint
      expect(result.status).toBe('error');
    });
  });

  describe('updateOrganizationRelationship', () => {
    let testRelationshipId: string;

    beforeEach(async () => {
      // Create a test relationship using service client
      const serviceClient = TestClientFactory.getServiceRoleClient();
      
      const { data: relationship, error } = await serviceClient
        .from('org_relationships')
        .insert({
          profile_id: testUser.id,
          organization_id: testOrganization.id,
          connection_type: 'current',
          department: 'Engineering',
          notes: 'Original notes'
        })
        .select('id')
        .single();
      
      expect(error).toBeNull();
      testRelationshipId = relationship.id;
      createdRelationshipIds.push(relationship.id);
    });

    test('should update relationship successfully', async () => {
      const updateData = {
        connection_type: 'former' as const,
        department: 'Marketing',
        notes: 'Updated notes'
      };

      // API call using the authenticated client
      const result = await organizationRelationshipsApi.updateOrganizationRelationship(
        testRelationshipId,
        updateData,
        authenticatedClient
      );
      
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
      
      // Verify the update in the database using service client
      const serviceClient = TestClientFactory.getServiceRoleClient();
      const { data: relationship, error } = await serviceClient
        .from('org_relationships')
        .select('*')
        .eq('id', testRelationshipId)
        .single();
      
      expect(error).toBeNull();
      expect(relationship).toMatchObject({
        connection_type: 'former',
        department: 'Marketing',
        notes: 'Updated notes'
      });
    });

    test('should handle non-existent relationship update gracefully', async () => {
      const nonExistentId = uuidv4();
      const result = await organizationRelationshipsApi.updateOrganizationRelationship(
        nonExistentId,
        { connection_type: 'former' },
        authenticatedClient
      );
      
      // Should return an error for non-existent relationships
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });
  });

  describe('deleteOrganizationRelationship', () => {
    let testRelationshipId: string;

    beforeEach(async () => {
      // Create a test relationship using service client
      const serviceClient = TestClientFactory.getServiceRoleClient();
      
      const { data: relationship, error } = await serviceClient
        .from('org_relationships')
        .insert({
          profile_id: testUser.id,
          organization_id: testOrganization.id,
          connection_type: 'current',
          department: 'Engineering'
        })
        .select('id')
        .single();
      
      expect(error).toBeNull();
      testRelationshipId = relationship.id;
      createdRelationshipIds.push(relationship.id);
    });

    test('should delete relationship successfully', async () => {
      // API call using the authenticated client
      const result = await organizationRelationshipsApi.deleteOrganizationRelationship(testRelationshipId, authenticatedClient);
      
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
      
      // Verify the relationship was deleted using service client
      const serviceClient = TestClientFactory.getServiceRoleClient();
      const { data: relationship, error } = await serviceClient
        .from('org_relationships')
        .select('*')
        .eq('id', testRelationshipId)
        .maybeSingle();
      
      expect(error).toBeNull();
      expect(relationship).toBeNull();
      
      // Remove from tracking since it's now deleted
      createdRelationshipIds = createdRelationshipIds.filter(id => id !== testRelationshipId);
    });

    test('should handle non-existent relationship deletion gracefully', async () => {
      const nonExistentId = uuidv4();
      const result = await organizationRelationshipsApi.deleteOrganizationRelationship(nonExistentId, authenticatedClient);
      
      // Delete operations on non-existent rows typically succeed
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
    });
  });
});
