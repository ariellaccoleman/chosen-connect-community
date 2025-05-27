
import { organizationRelationshipsApi } from '@/api/organizations/relationshipsApi';
import { TestClientFactory, TestInfrastructure } from '@/integrations/supabase/testClient';
import { PersistentTestUserHelper } from '../../utils/persistentTestUsers';
import { TestAuthUtils } from '../../utils/testAuthUtils';
import { ProfileOrganizationRelationship } from '@/types';
import { v4 as uuidv4 } from 'uuid';

describe('Organization Relationships API - Database Tests', () => {
  let testUser: any;
  let testOrganization: any;
  let createdRelationshipIds: string[] = [];
  let createdOrganizationIds: string[] = [];
  let testOrgName: string;
  
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
      await TestAuthUtils.setupTestAuth('user1');
      
      // Wait longer for auth to settle and verify multiple times
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get the authenticated user with retries
      console.log('👤 Getting current test user...');
      testUser = await TestAuthUtils.getCurrentTestUser();
      
      if (!testUser) {
        throw new Error('Failed to get test user');
      }
      
      console.log('✅ Test user authenticated:', testUser.id, testUser.email);
      
      // Verify authentication is working with multiple retries and longer waits
      let authVerified = false;
      for (let i = 0; i < 5; i++) {
        try {
          const client = await TestClientFactory.getSharedTestClient();
          const { data: { session } } = await client.auth.getSession();
          if (session && session.user && session.access_token) {
            authVerified = true;
            console.log(`✅ Authentication verified on attempt ${i + 1} - User: ${session.user.email}, Token: [${session.access_token.substring(0, 20)}...]`);
            break;
          }
          console.log(`⏳ Auth verification attempt ${i + 1} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.log(`⏳ Auth verification attempt ${i + 1} error:`, error);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      if (!authVerified) {
        throw new Error('Authentication verification failed after retries');
      }
      
      // Create a test organization using service client
      const serviceClient = TestClientFactory.getServiceRoleClient();
      
      // Ensure profile exists first - use service client to bypass RLS
      const { error: profileError } = await serviceClient
        .from('profiles')
        .upsert({ 
          id: testUser.id, 
          email: testUser.email || 'testuser1@example.com',
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
      
      // Final auth verification before proceeding
      const finalAuthState = await TestAuthUtils.verifyAuthState();
      if (!finalAuthState.isAuthenticated) {
        throw new Error('Final auth verification failed - user not authenticated');
      }
      
    } catch (error) {
      console.error('❌ Test setup failed:', error);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      await cleanupTestData();
      
      // Clean up test authentication
      await TestAuthUtils.cleanupTestAuth();
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
      // Verify authentication is still valid
      const authState = await TestAuthUtils.verifyAuthState();
      if (!authState.isAuthenticated) {
        throw new Error('Test user not authenticated');
      }

      console.log('🧪 Testing getUserOrganizationRelationships with no relationships');
      const result = await organizationRelationshipsApi.getUserOrganizationRelationships(testUser.id);
      
      expect(result.status).toBe('success');
      expect(result.data).toEqual([]);
    });

    test('should return user relationships with organization details', async () => {
      // Verify authentication is still valid
      const authState = await TestAuthUtils.verifyAuthState();
      if (!authState.isAuthenticated) {
        throw new Error('Test user not authenticated');
      }

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
        console.log('✅ Created test relationship:', relationshipData.id);
      }
      
      // Wait for data to be committed
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Test the API using the authenticated main client
      const result = await organizationRelationshipsApi.getUserOrganizationRelationships(testUser.id);
      
      console.log('🔍 API Response:', {
        status: result.status,
        dataLength: result.data?.length || 0,
        error: result.error
      });
      
      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(1);
      
      // Safe array access with proper checks
      if (result.data && result.data.length > 0) {
        expect(result.data[0]).toMatchObject({
          profile_id: testUser.id,
          organization_id: testOrganization.id,
          connection_type: 'current',
          department: 'Engineering',
          notes: 'Test relationship'
        });
        expect(result.data[0].organization).toBeDefined();
        expect(result.data[0].organization.name).toBe(testOrganization.name);
      } else {
        fail('Expected relationship data but got empty array');
      }
    });

    test('should handle invalid UUID format gracefully', async () => {
      console.log('🧪 Testing getUserOrganizationRelationships with invalid UUID');
      const result = await organizationRelationshipsApi.getUserOrganizationRelationships('not-a-valid-uuid');
      
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });
  });

  describe('addOrganizationRelationship', () => {
    test('should create a new relationship successfully', async () => {
      console.log('🧪 Testing addOrganizationRelationship');
      
      // Verify authentication before making the request
      const authState = await TestAuthUtils.verifyAuthState();
      if (!authState.isAuthenticated) {
        throw new Error('Test user not authenticated for relationship creation');
      }
      
      const relationshipData = {
        profile_id: testUser.id,
        organization_id: testOrganization.id,
        connection_type: 'current' as const,
        department: 'Engineering',
        notes: 'New relationship'
      };

      console.log('🔍 Calling addOrganizationRelationship with data:', relationshipData);
      
      // API call will now use the authenticated main client
      const result = await organizationRelationshipsApi.addOrganizationRelationship(relationshipData);
      
      console.log('🔍 API Response:', {
        status: result.status,
        data: result.data,
        error: result.error
      });
      
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
      
      // Wait for data to be committed
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Verify the relationship was created in the database using service client
      const serviceClient = TestClientFactory.getServiceRoleClient();
      const { data: relationships, error } = await serviceClient
        .from('org_relationships')
        .select('*')
        .eq('profile_id', testUser.id)
        .eq('organization_id', testOrganization.id);
      
      expect(error).toBeNull();
      expect(relationships).toHaveLength(1);
      
      if (relationships && relationships.length > 0) {
        expect(relationships[0]).toMatchObject({
          profile_id: testUser.id,
          organization_id: testOrganization.id,
          connection_type: 'current',
          department: 'Engineering',
          notes: 'New relationship'
        });
        
        // Track the created relationship for cleanup
        createdRelationshipIds.push(relationships[0].id);
      } else {
        fail('Expected relationship to be created but none found');
      }
    });

    test('should handle missing profile_id', async () => {
      console.log('🧪 Testing addOrganizationRelationship with missing profile_id');
      
      const relationshipData = {
        organization_id: testOrganization.id,
        connection_type: 'current' as const
      } as any;

      const result = await organizationRelationshipsApi.addOrganizationRelationship(relationshipData);
      
      expect(result.status).toBe('error');
      expect(result.error?.message).toContain('Profile ID is required');
    });

    test('should handle non-existent organization', async () => {
      console.log('🧪 Testing addOrganizationRelationship with non-existent organization');
      
      // Verify authentication before making the request
      const authState = await TestAuthUtils.verifyAuthState();
      if (!authState.isAuthenticated) {
        throw new Error('Test user not authenticated for non-existent org test');
      }
      
      const relationshipData = {
        profile_id: testUser.id,
        organization_id: uuidv4(),
        connection_type: 'current' as const,
        department: 'Engineering'
      };

      const result = await organizationRelationshipsApi.addOrganizationRelationship(relationshipData);
      
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
      
      // Wait for data to be committed
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    test('should update relationship successfully', async () => {
      // Verify authentication before making the request
      const authState = await TestAuthUtils.verifyAuthState();
      if (!authState.isAuthenticated) {
        throw new Error('Test user not authenticated for relationship update');
      }
      
      const updateData = {
        connection_type: 'former' as const,
        department: 'Marketing',
        notes: 'Updated notes'
      };

      // API call will now use the authenticated main client
      const result = await organizationRelationshipsApi.updateOrganizationRelationship(
        testRelationshipId,
        updateData
      );
      
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
      
      // Wait for update to be committed
      await new Promise(resolve => setTimeout(resolve, 200));
      
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

    test('should handle non-existent relationship gracefully', async () => {
      // Verify authentication before making the request
      const authState = await TestAuthUtils.verifyAuthState();
      if (!authState.isAuthenticated) {
        throw new Error('Test user not authenticated for non-existent relationship test');
      }
      
      const nonExistentId = uuidv4();
      const result = await organizationRelationshipsApi.updateOrganizationRelationship(
        nonExistentId,
        { connection_type: 'former' }
      );
      
      // Update operations on non-existent rows typically succeed but affect 0 rows
      // The API should handle this gracefully and return success
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
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
      
      // Wait for data to be committed
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    test('should delete relationship successfully', async () => {
      // Verify authentication before making the request
      const authState = await TestAuthUtils.verifyAuthState();
      if (!authState.isAuthenticated) {
        throw new Error('Test user not authenticated for relationship deletion');
      }
      
      // API call will now use the authenticated main client
      const result = await organizationRelationshipsApi.deleteOrganizationRelationship(testRelationshipId);
      
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
      
      // Wait for deletion to be committed
      await new Promise(resolve => setTimeout(resolve, 200));
      
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

    test('should handle non-existent relationship gracefully', async () => {
      // Verify authentication before making the request
      const authState = await TestAuthUtils.verifyAuthState();
      if (!authState.isAuthenticated) {
        throw new Error('Test user not authenticated for non-existent relationship deletion');
      }
      
      const nonExistentId = uuidv4();
      const result = await organizationRelationshipsApi.deleteOrganizationRelationship(nonExistentId);
      
      // Delete operations on non-existent rows typically succeed
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
    });
  });
});
