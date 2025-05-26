
import { organizationRelationshipsApi } from '@/api/organizations/relationshipsApi';
import { TestClientFactory, TestInfrastructure } from '@/integrations/supabase/testClient';
import { PersistentTestUserHelper } from '../../utils/persistentTestUsers';
import { ProfileOrganizationRelationship } from '@/types';

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
    // Clean up test data
    await TestInfrastructure.cleanupTable('org_relationships');
    
    // Create a test user (using persistent test user)
    try {
      const userClient = await PersistentTestUserHelper.getUser1Client();
      const { data: { user } } = await userClient.auth.getUser();
      testUser = user;
    } catch (error) {
      console.warn('Could not get test user, using mock ID');
      testUser = { id: 'test-user-id' };
    }
    
    // Create a test organization
    const serviceClient = TestClientFactory.getServiceRoleClient();
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
  });

  afterEach(async () => {
    // Clean up test data
    const serviceClient = TestClientFactory.getServiceRoleClient();
    
    if (testOrganization?.id) {
      await serviceClient
        .from('organizations')
        .delete()
        .eq('id', testOrganization.id);
    }
    
    await TestInfrastructure.cleanupTable('org_relationships');
  });

  afterAll(() => {
    TestClientFactory.cleanup();
  });

  describe('getUserOrganizationRelationships', () => {
    test('should return empty array when user has no relationships', async () => {
      const result = await organizationRelationshipsApi.getUserOrganizationRelationships(testUser.id);
      
      expect(result.status).toBe('success');
      expect(result.data).toEqual([]);
    });

    test('should return user relationships with organization details', async () => {
      // Create a test relationship directly in database
      const serviceClient = TestClientFactory.getServiceRoleClient();
      
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
      
      // Test the API
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

    test('should handle database errors gracefully', async () => {
      const result = await organizationRelationshipsApi.getUserOrganizationRelationships('invalid-uuid');
      
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });
  });

  describe('addOrganizationRelationship', () => {
    test('should create a new relationship successfully', async () => {
      const relationshipData = {
        profile_id: testUser.id,
        organization_id: testOrganization.id,
        connection_type: 'current' as const,
        department: 'Engineering',
        notes: 'New relationship'
      };

      const result = await organizationRelationshipsApi.addOrganizationRelationship(relationshipData);
      
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
      
      // Verify the relationship was created in the database
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
    });

    test('should create profile if it doesn\'t exist', async () => {
      const newProfileId = 'new-profile-id';
      
      const relationshipData = {
        profile_id: newProfileId,
        organization_id: testOrganization.id,
        connection_type: 'current' as const,
        department: 'Marketing'
      };

      const result = await organizationRelationshipsApi.addOrganizationRelationship(relationshipData);
      
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
      
      // Verify the profile was created
      const serviceClient = TestClientFactory.getServiceRoleClient();
      const { data: profile, error: profileError } = await serviceClient
        .from('profiles')
        .select('id')
        .eq('id', newProfileId)
        .single();
      
      expect(profileError).toBeNull();
      expect(profile.id).toBe(newProfileId);
      
      // Verify the relationship was created
      const { data: relationships, error: relationshipError } = await serviceClient
        .from('org_relationships')
        .select('*')
        .eq('profile_id', newProfileId);
      
      expect(relationshipError).toBeNull();
      expect(relationships).toHaveLength(1);
    });

    test('should handle missing profile_id', async () => {
      const relationshipData = {
        organization_id: testOrganization.id,
        connection_type: 'current' as const
      } as any;

      const result = await organizationRelationshipsApi.addOrganizationRelationship(relationshipData);
      
      expect(result.status).toBe('error');
      expect(result.error.message).toContain('Profile ID is required');
    });
  });

  describe('updateOrganizationRelationship', () => {
    let testRelationshipId: string;

    beforeEach(async () => {
      // Create a test relationship
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
    });

    test('should update relationship successfully', async () => {
      const updateData = {
        connection_type: 'former' as const,
        department: 'Marketing',
        notes: 'Updated notes'
      };

      const result = await organizationRelationshipsApi.updateOrganizationRelationship(
        testRelationshipId,
        updateData
      );
      
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
      
      // Verify the update in the database
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

    test('should handle non-existent relationship', async () => {
      const result = await organizationRelationshipsApi.updateOrganizationRelationship(
        'non-existent-id',
        { connection_type: 'former' }
      );
      
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });
  });

  describe('deleteOrganizationRelationship', () => {
    let testRelationshipId: string;

    beforeEach(async () => {
      // Create a test relationship
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
    });

    test('should delete relationship successfully', async () => {
      const result = await organizationRelationshipsApi.deleteOrganizationRelationship(testRelationshipId);
      
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
      
      // Verify the relationship was deleted
      const serviceClient = TestClientFactory.getServiceRoleClient();
      const { data: relationship, error } = await serviceClient
        .from('org_relationships')
        .select('*')
        .eq('id', testRelationshipId)
        .maybeSingle();
      
      expect(error).toBeNull();
      expect(relationship).toBeNull();
    });

    test('should handle non-existent relationship', async () => {
      const result = await organizationRelationshipsApi.deleteOrganizationRelationship('non-existent-id');
      
      expect(result.status).toBe('success'); // Delete operations often succeed even if nothing to delete
      expect(result.data).toBe(true);
    });
  });
});
