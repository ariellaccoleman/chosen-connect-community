
import { organizationRelationshipsApi } from '@/api/organizations/relationshipsApi';
import { apiClient } from '@/api/core/apiClient';
import { createChainableMock, createSuccessResponse, createErrorResponse } from '../../utils/supabaseMockUtils';

// Mock the API client
jest.mock('@/api/core/apiClient', () => ({
  apiClient: {
    query: jest.fn((callback) => callback(mockSupabase))
  }
}));

// Set up mock Supabase
const mockSupabase = createChainableMock();

describe('Organization Relationships API', () => {
  beforeEach(() => {
    mockSupabase.reset();
    jest.clearAllMocks();
  });

  describe('getUserOrganizationRelationships', () => {
    const profileId = 'profile-123';
    const mockRelationships = [
      {
        id: 'rel-1',
        profile_id: profileId,
        organization_id: 'org-1',
        connection_type: 'current',
        department: 'Engineering',
        organization: {
          id: 'org-1',
          name: 'Test Org',
          location: { id: 'loc-1', city: 'Test City', country: 'Test Country' }
        }
      }
    ];

    test('should return organization relationships with formatted data', async () => {
      // Set up mock response
      mockSupabase.mockResponseFor('org_relationships', createSuccessResponse(mockRelationships));

      // Call the API function
      const result = await organizationRelationshipsApi.getUserOrganizationRelationships(profileId);

      // Check if Supabase query was called correctly
      expect(mockSupabase.from).toHaveBeenCalledWith('org_relationships');
      expect(mockSupabase.select).toHaveBeenCalledWith(`
          *,
          organization:organizations(
            *,
            location:locations(*)
          )
        `);
      expect(mockSupabase.eq).toHaveBeenCalledWith('profile_id', profileId);

      // Check the result
      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('rel-1');
      expect(result.data[0].organization.name).toBe('Test Org');
    });

    test('should handle errors when fetching relationships', async () => {
      // Mock error response
      mockSupabase.mockResponseFor('org_relationships', createErrorResponse('Database error'));
      
      // Call the API function and expect it to throw
      let error;
      try {
        await organizationRelationshipsApi.getUserOrganizationRelationships(profileId);
      } catch (e) {
        error = e;
      }

      // Check if error was handled correctly
      expect(error).toBeDefined();
      expect(error.message).toBe('Database error');
    });
  });

  describe('addOrganizationRelationship', () => {
    const mockRelationship = {
      profile_id: 'profile-123',
      organization_id: 'org-1',
      connection_type: 'current',
      department: 'Engineering'
    };

    test('should add organization relationship successfully', async () => {
      // Set up mock responses
      mockSupabase.mockResponseFor('profiles', createSuccessResponse({ id: 'profile-123' }));
      mockSupabase.mockResponseFor('org_relationships', createSuccessResponse(null));

      // Call the API function
      const result = await organizationRelationshipsApi.addOrganizationRelationship(mockRelationship);

      // Check if Supabase queries were called correctly
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.select).toHaveBeenCalledWith('id');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'profile-123');
      expect(mockSupabase.maybeSingle).toHaveBeenCalled();

      expect(mockSupabase.from).toHaveBeenCalledWith('org_relationships');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        profile_id: 'profile-123',
        organization_id: 'org-1',
        connection_type: 'current',
        department: 'Engineering',
        notes: undefined
      });

      // Check the result
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
    });

    test('should create profile if it does not exist', async () => {
      const newProfileRelationship = {
        profile_id: 'new-profile-123',
        organization_id: 'org-1',
        connection_type: 'current'
      };

      // Set up mock responses
      mockSupabase.mockResponseFor('profiles', createSuccessResponse(null))
                  .mockResponseFor('org_relationships', createSuccessResponse(null));

      // Call the API function
      const result = await organizationRelationshipsApi.addOrganizationRelationship(newProfileRelationship);

      // Check if profile was created
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.insert).toHaveBeenCalledWith({ id: 'new-profile-123' });

      // Check if relationship was created
      expect(mockSupabase.from).toHaveBeenCalledWith('org_relationships');
      expect(mockSupabase.insert).toHaveBeenCalled();

      // Check the result
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
    });
  });

  // Add tests for updateOrganizationRelationship
  describe('updateOrganizationRelationship', () => {
    const relationshipId = 'rel-1';
    const updateData = {
      connection_type: 'former',
      department: 'Marketing',
      notes: 'Updated notes'
    };

    test('should update organization relationship successfully', async () => {
      // Set up mock response
      mockSupabase.mockResponseFor('org_relationships', createSuccessResponse(null));

      // Call the API function
      const result = await organizationRelationshipsApi.updateOrganizationRelationship(relationshipId, updateData);

      // Check if Supabase query was called correctly
      expect(mockSupabase.from).toHaveBeenCalledWith('org_relationships');
      expect(mockSupabase.update).toHaveBeenCalledWith({
        connection_type: 'former',
        department: 'Marketing',
        notes: 'Updated notes'
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', relationshipId);

      // Check the result
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
    });

    test('should handle errors when updating relationship', async () => {
      // Mock error response
      mockSupabase.mockResponseFor('org_relationships', createErrorResponse('Database error'));
      
      // Call the API function and expect it to throw
      let error;
      try {
        await organizationRelationshipsApi.updateOrganizationRelationship(relationshipId, updateData);
      } catch (e) {
        error = e;
      }

      // Check if error was handled correctly
      expect(error).toBeDefined();
      expect(error.message).toBe('Database error');
    });
  });

  // Add tests for deleteOrganizationRelationship
  describe('deleteOrganizationRelationship', () => {
    const relationshipId = 'rel-1';

    test('should delete organization relationship successfully', async () => {
      // Set up mock response
      mockSupabase.mockResponseFor('org_relationships', createSuccessResponse(null));

      // Call the API function
      const result = await organizationRelationshipsApi.deleteOrganizationRelationship(relationshipId);

      // Check if Supabase query was called correctly
      expect(mockSupabase.from).toHaveBeenCalledWith('org_relationships');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', relationshipId);

      // Check the result
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
    });

    test('should handle errors when deleting relationship', async () => {
      // Mock error response
      mockSupabase.mockResponseFor('org_relationships', createErrorResponse('Database error'));
      
      // Call the API function and expect it to throw
      let error;
      try {
        await organizationRelationshipsApi.deleteOrganizationRelationship(relationshipId);
      } catch (e) {
        error = e;
      }

      // Check if error was handled correctly
      expect(error).toBeDefined();
      expect(error.message).toBe('Database error');
    });
  });
});
