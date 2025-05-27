import { organizationRelationshipsApi } from '@/api/organizations/relationshipsApi';
import { TestClientFactory, TestInfrastructure } from '@/integrations/supabase/testClient';
import { PersistentTestUserHelper } from '../../utils/persistentTestUsers';
import { TestAuthUtils } from '../../utils/testAuthUtils';
import { ProfileOrganizationRelationship } from '@/types';
import { v4 as uuidv4 } from 'uuid';

describe('Organization Relationships API - Database Tests', () => {
  let testUser: any;
  let testOrganization: any;
  
  beforeAll(async () => {
    // Verify test users are set up
    const isSetup = await PersistentTestUserHelper.verifyTestUsersSetup();
    if (!isSetup) {
      console.warn('⚠️ Persistent test users not set up - some tests may fail');
    }
  });

  beforeEach(async () => {
    try {
      // Clean up test data first
      await TestInfrastructure.cleanupTable('org_relationships');
      
      // Set up authentication for the main client
      console.log('🔐 Setting up test authentication...');
      await TestAuthUtils.setupTestAuth('user1');
      
      // Get the authenticated user
      console.log('👤 Getting current test user...');
      testUser = await TestAuthUtils.getCurrentTestUser();
      console.log('✅ Test user authenticated:', testUser.id, testUser.email);
      
      // Create a test organization using service client (for setup only)
      const serviceClient = await TestClientFactory.getServiceRoleClient();
      
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
      
      const { data: orgData, error: orgError } = await serviceClient
        .from('organizations')
        .insert({
          name: 'Test Organization',
          description: 'A test organization'
        })
        .select()
        .single();
      
      if (orgError) {
        console.error('Failed to create test organization:', orgError);
        throw orgError;
      }
      
      testOrganization = orgData;
      console.log('✅ Test setup complete');
    } catch (error) {
      console.error('❌ Test setup failed:', error);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      // Clean up test data using service client
      const serviceClient = await TestClientFactory.getServiceRoleClient();
      
      if (testOrganization?.id) {
        await serviceClient
          .from('organizations')
          .delete()
          .eq('id', testOrganization.id);
      }
      
      await TestInfrastructure.cleanupTable('org_relationships');
      
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

  describe('getUserOrganizationRelationships', () => {
    test('should return empty array when user has no relationships', async () => {
      // Verify authentication is still valid
      const client = await TestClientFactory.getSharedTestClient();
      const { data: { session } } = await client.auth.getSession();
      if (!session) {
        throw new Error('Test user not authenticated');
      }

      console.log('🧪 Testing getUserOrganizationRelationships with no relationships');
      const result = await organizationRelationshipsApi.getUserOrganizationRelationships(testUser.id);
      
      expect(result.status).toBe('success');
      expect(result.data).toEqual([]);
    });

    test('should return user relationships with organization details', async () => {
      // Verify authentication is still valid
      const client = await TestClientFactory.getSharedTestClient();
      const { data: { session } } = await client.auth.getSession();
      if (!session) {
        throw new Error('Test user not authenticated');
      }

      console.log('🧪 Testing getUserOrganizationRelationships with existing relationship');
      
      // Create a test relationship directly in database using service client
      const serviceClient = await TestClientFactory.getServiceRoleClient();
      
      const { error: relationshipError } = await serviceClient
        .from('org_relationships')
        .insert({
          profile_id: testUser.id,
          organization_id: testOrganization.id,
          connection_type: 'current',
          department: 'Engineering',
          notes: 'Test relationship'
        });
      
      expect(relationshipError).toBeNull();
      
      // Test the API using the authenticated main client
      const result = await organizationRelationshipsApi.getUserOrganizationRelationships(testUser.id);
      
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
      expect(result.data[0].organization.name).toBe('Test Organization');
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
      
      // Verify the relationship was created in the database using service client
      const serviceClient = await TestClientFactory.getServiceRoleClient();
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
    });

    test('should handle missing profile_id', async () => {
      console.log('🧪 Testing addOrganizationRelationship with missing profile_id');
      
      const relationshipData = {
        organization_id: testOrganization.id,
        connection_type: 'current' as const
      } as any;

      const result = await organizationRelationshipsApi.addOrganizationRelationship(relationshipData);
      
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

      const result = await organizationRelationshipsApi.addOrganizationRelationship(relationshipData);
      
      // Should fail due to foreign key constraint
      expect(result.status).toBe('error');
    });
  });

  describe('updateOrganizationRelationship', () => {
    let testRelationshipId: string;

    beforeEach(async () => {
      // Create a test relationship using service client
      const serviceClient = await TestClientFactory.getServiceRoleClient();
      
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
    });

    test('should update relationship successfully', async () => {
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
      
      // Verify the update in the database using service client
      const serviceClient = await TestClientFactory.getServiceRoleClient();
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

    test('should handle non-existent relationship', async () => {
      const result = await organizationRelationshipsApi.updateOrganizationRelationship(
        uuidv4(),
        { connection_type: 'former' }
      );
      
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });
  });

  describe('deleteOrganizationRelationship', () => {
    let testRelationshipId: string;

    beforeEach(async () => {
      // Create a test relationship using service client
      const serviceClient = await TestClientFactory.getServiceRoleClient();
      
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
    });

    test('should delete relationship successfully', async () => {
      // API call will now use the authenticated main client
      const result = await organizationRelationshipsApi.deleteOrganizationRelationship(testRelationshipId);
      
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
      
      // Verify the relationship was deleted using service client
      const serviceClient = await TestClientFactory.getServiceRoleClient();
      const { data: relationship, error } = await serviceClient
        .from('org_relationships')
        .select('*')
        .eq('id', testRelationshipId)
        .maybeSingle();
      
      expect(error).toBeNull();
      expect(relationship).toBeNull();
    });

    test('should handle non-existent relationship', async () => {
      const result = await organizationRelationshipsApi.deleteOrganizationRelationship(uuidv4());
      
      expect(result.status).toBe('success'); // Delete operations often succeed even if nothing to delete
      expect(result.data).toBe(true);
    });
  });
});
