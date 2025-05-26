
import { organizationRelationshipsApi } from '@/api/organizations/relationshipsApi';
import { TestClientFactory, TestInfrastructure } from '@/integrations/supabase/testClient';
import { AuthenticatedApiTestUtils } from '../../utils/authenticatedApiUtils';
import { ProfileOrganizationRelationship } from '@/types';
import { v4 as uuidv4 } from 'uuid';

describe('Organization Relationships API - Database Tests', () => {
  let testUser: any;
  let testOrganization: any;
  
  beforeAll(async () => {
    // Set up authenticated API client for all tests
    await AuthenticatedApiTestUtils.setupAuthenticatedClient();
  });

  beforeEach(async () => {
    // Clean up test data first
    await TestInfrastructure.cleanupTable('org_relationships');
    
    // Get authenticated test user
    testUser = await AuthenticatedApiTestUtils.getTestUser();
    
    // Create a test organization using service client (for setup only)
    const serviceClient = TestClientFactory.getServiceRoleClient();
    
    // Ensure profile exists first - use service client to bypass RLS for setup
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
  });

  afterEach(async () => {
    // Clean up test data using service client
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
    AuthenticatedApiTestUtils.resetClient();
    TestClientFactory.cleanup();
  });

  describe('getUserOrganizationRelationships', () => {
    test('should return empty array when user has no relationships', async () => {
      const result = await organizationRelationshipsApi.getUserOrganizationRelationships(testUser.id);
      
      expect(result.status).toBe('success');
      expect(result.data).toEqual([]);
    });

    test('should return user relationships with organization details', async () => {
      // Create a test relationship using the API (which now uses authenticated client)
      const createResult = await organizationRelationshipsApi.addOrganizationRelationship({
        profile_id: testUser.id,
        organization_id: testOrganization.id,
        connection_type: 'current',
        department: 'Engineering',
        notes: 'Test relationship'
      });
      
      expect(createResult.status).toBe('success');
      
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

    test('should handle invalid UUID format gracefully', async () => {
      const result = await organizationRelationshipsApi.getUserOrganizationRelationships('not-a-valid-uuid');
      
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

      console.log('🔍 Test Debug: Calling addOrganizationRelationship with data:', relationshipData);
      console.log('🔍 Test User:', testUser);
      console.log('🔍 Test Organization:', testOrganization);
      
      const result = await organizationRelationshipsApi.addOrganizationRelationship(relationshipData);
      
      console.log('🔍 Test Debug: API Response Status:', result.status);
      console.log('🔍 Test Debug: API Response Data:', result.data);
      console.log('🔍 Test Debug: API Response Error:', result.error);
      
      if (result.status === 'error') {
        console.error('🚨 API Error Details:', {
          message: result.error?.message,
          code: result.error?.code,
          details: result.error?.details,
          original: result.error?.original
        });
      }
      
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
      
      // Verify the relationship was created using the API
      const verifyResult = await organizationRelationshipsApi.getUserOrganizationRelationships(testUser.id);
      
      expect(verifyResult.status).toBe('success');
      expect(verifyResult.data).toHaveLength(1);
      expect(verifyResult.data[0]).toMatchObject({
        profile_id: testUser.id,
        organization_id: testOrganization.id,
        connection_type: 'current',
        department: 'Engineering',
        notes: 'New relationship'
      });
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

    test('should handle non-existent organization', async () => {
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

    test('should handle non-existent profile', async () => {
      const nonExistentProfileId = uuidv4();
      
      const relationshipData = {
        profile_id: nonExistentProfileId,
        organization_id: testOrganization.id,
        connection_type: 'current' as const,
        department: 'Engineering'
      };

      const result = await organizationRelationshipsApi.addOrganizationRelationship(relationshipData);
      
      // Should fail due to foreign key constraint or RLS
      expect(result.status).toBe('error');
    });
  });

  describe('updateOrganizationRelationship', () => {
    let testRelationshipId: string;

    beforeEach(async () => {
      // Create a test relationship using the API
      const createResult = await organizationRelationshipsApi.addOrganizationRelationship({
        profile_id: testUser.id,
        organization_id: testOrganization.id,
        connection_type: 'current',
        department: 'Engineering',
        notes: 'Original notes'
      });
      
      expect(createResult.status).toBe('success');
      
      // Get the relationship ID
      const relationshipsResult = await organizationRelationshipsApi.getUserOrganizationRelationships(testUser.id);
      expect(relationshipsResult.status).toBe('success');
      expect(relationshipsResult.data).toHaveLength(1);
      
      testRelationshipId = relationshipsResult.data[0].id;
    });

    test('should update relationship successfully', async () => {
      const updateData = {
        connection_type: 'former' as const,
        department: 'Marketing',
        notes: 'Updated notes'
      };

      console.log('🔍 Test Debug: Calling updateOrganizationRelationship with:', {
        relationshipId: testRelationshipId,
        updateData
      });

      const result = await organizationRelationshipsApi.updateOrganizationRelationship(
        testRelationshipId,
        updateData
      );
      
      console.log('🔍 Test Debug: Update API Response:', {
        status: result.status,
        data: result.data,
        error: result.error
      });
      
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
      
      // Verify the update using the API
      const verifyResult = await organizationRelationshipsApi.getUserOrganizationRelationships(testUser.id);
      expect(verifyResult.status).toBe('success');
      expect(verifyResult.data[0]).toMatchObject({
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
      // Create a test relationship using the API
      const createResult = await organizationRelationshipsApi.addOrganizationRelationship({
        profile_id: testUser.id,
        organization_id: testOrganization.id,
        connection_type: 'current',
        department: 'Engineering'
      });
      
      expect(createResult.status).toBe('success');
      
      // Get the relationship ID
      const relationshipsResult = await organizationRelationshipsApi.getUserOrganizationRelationships(testUser.id);
      expect(relationshipsResult.status).toBe('success');
      expect(relationshipsResult.data).toHaveLength(1);
      
      testRelationshipId = relationshipsResult.data[0].id;
    });

    test('should delete relationship successfully', async () => {
      console.log('🔍 Test Debug: Calling deleteOrganizationRelationship with id:', testRelationshipId);
      
      const result = await organizationRelationshipsApi.deleteOrganizationRelationship(testRelationshipId);
      
      console.log('🔍 Test Debug: Delete API Response:', {
        status: result.status,
        data: result.data,
        error: result.error
      });
      
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
      
      // Verify the relationship was deleted using the API
      const verifyResult = await organizationRelationshipsApi.getUserOrganizationRelationships(testUser.id);
      expect(verifyResult.status).toBe('success');
      expect(verifyResult.data).toEqual([]);
    });

    test('should handle non-existent relationship', async () => {
      const result = await organizationRelationshipsApi.deleteOrganizationRelationship(uuidv4());
      
      expect(result.status).toBe('success'); // Delete operations often succeed even if nothing to delete
      expect(result.data).toBe(true);
    });
  });
});
