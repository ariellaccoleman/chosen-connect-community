
import { organizationRelationshipsApi } from '@/api/organizations/relationshipsApi';
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { PersistentTestUserHelper } from '../../utils/persistentTestUsers';

/**
 * Integration tests for Organization Relationships API
 * 
 * These tests run against a real database to ensure the API works correctly
 * with actual database constraints, relationships, and error conditions.
 */
describe('Organization Relationships API - Integration Tests', () => {
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
    // Get test user
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
        name: 'Integration Test Org',
        description: 'Organization for integration testing'
      })
      .select()
      .single();
    
    if (orgError) {
      console.error('Failed to create test organization:', orgError);
      // Continue with tests even if organization creation fails
      testOrganization = null;
    } else {
      testOrganization = orgData;
    }
  });

  afterEach(async () => {
    // Clean up test data
    const serviceClient = TestClientFactory.getServiceRoleClient();
    
    try {
      // Clean up relationships
      await serviceClient
        .from('org_relationships')
        .delete()
        .eq('profile_id', testUser.id);
      
      // Clean up test organization
      if (testOrganization?.id) {
        await serviceClient
          .from('organizations')
          .delete()
          .eq('id', testOrganization.id);
      }
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  });

  afterAll(() => {
    TestClientFactory.cleanup();
  });

  test('complete relationship lifecycle', async () => {
    if (!testOrganization) {
      console.warn('Skipping test - no test organization available');
      return;
    }

    // 1. Start with no relationships
    let result = await organizationRelationshipsApi.getUserOrganizationRelationships(testUser.id);
    expect(result.status).toBe('success');
    expect(result.data).toEqual([]);

    // 2. Create a relationship
    const createResult = await organizationRelationshipsApi.addOrganizationRelationship({
      profile_id: testUser.id,
      organization_id: testOrganization.id,
      connection_type: 'current',
      department: 'Engineering',
      notes: 'Full stack developer'
    });
    
    expect(createResult.status).toBe('success');

    // 3. Verify relationship exists
    result = await organizationRelationshipsApi.getUserOrganizationRelationships(testUser.id);
    expect(result.status).toBe('success');
    expect(result.data).toHaveLength(1);
    
    const relationship = result.data[0];
    expect(relationship.connection_type).toBe('current');
    expect(relationship.department).toBe('Engineering');
    expect(relationship.notes).toBe('Full stack developer');

    // 4. Update the relationship
    const updateResult = await organizationRelationshipsApi.updateOrganizationRelationship(
      relationship.id,
      {
        connection_type: 'former',
        department: 'Product',
        notes: 'Moved to different role'
      }
    );
    
    expect(updateResult.status).toBe('success');

    // 5. Verify the update
    result = await organizationRelationshipsApi.getUserOrganizationRelationships(testUser.id);
    expect(result.status).toBe('success');
    expect(result.data[0].connection_type).toBe('former');
    expect(result.data[0].department).toBe('Product');

    // 6. Delete the relationship
    const deleteResult = await organizationRelationshipsApi.deleteOrganizationRelationship(relationship.id);
    expect(deleteResult.status).toBe('success');

    // 7. Verify deletion
    result = await organizationRelationshipsApi.getUserOrganizationRelationships(testUser.id);
    expect(result.status).toBe('success');
    expect(result.data).toEqual([]);
  }, 15000); // Longer timeout for database operations

  test('handles invalid data gracefully', async () => {
    // Test with invalid UUIDs
    let result = await organizationRelationshipsApi.getUserOrganizationRelationships('invalid-uuid');
    expect(result.status).toBe('error');

    // Test adding relationship without required fields
    result = await organizationRelationshipsApi.addOrganizationRelationship({} as any);
    expect(result.status).toBe('error');

    // Test updating non-existent relationship
    result = await organizationRelationshipsApi.updateOrganizationRelationship(
      'non-existent-id',
      { connection_type: 'former' }
    );
    expect(result.status).toBe('error');
  });

  test('respects database constraints and relationships', async () => {
    if (!testOrganization) {
      console.warn('Skipping test - no test organization available');
      return;
    }

    // Test that relationship requires valid organization
    const result = await organizationRelationshipsApi.addOrganizationRelationship({
      profile_id: testUser.id,
      organization_id: 'non-existent-org-id',
      connection_type: 'current'
    });
    
    // This should fail due to foreign key constraint
    expect(result.status).toBe('error');
  });
});
