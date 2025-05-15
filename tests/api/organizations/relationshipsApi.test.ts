
import { organizationRelationshipsApi } from '@/api/organizations/relationshipsApi';
import { apiClient } from '@/api/core/apiClient';
import { createChainableMock } from '../../utils/supabaseMockUtils';

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
      mockSupabase.mockResponseFor('org_relationships', { data: mockRelationships, error: null });
      
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
      mockSupabase.mockResponseFor('org_relationships', { 
        data: null, 
        error: { message: 'Database error' } 
      });
      
      // Call the API function and expect it to throw
      await expect(organizationRelationshipsApi.getUserOrganizationRelationships(profileId))
        .rejects.toEqual({ message: 'Database error' });
    }, 10000); // Increase timeout for this test
  });

  describe('addOrganizationRelationship', () => {
    const mockRelationship = {
      profile_id: 'profile-123',
      organization_id: 'org-1',
      connection_type: 'current',
      department: 'Engineering'
    };

    test('should add organization relationship successfully', async () => {
      // Set up a sequence of mock responses for different operations
      mockSupabase.mockResponseFor('profiles', { data: { id: 'profile-123' }, error: null });
      mockSupabase.mockResponseFor('org_relationships', { data: null, error: null });
      
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
      mockSupabase.mockResponseFor('profiles', { data: null, error: null });
      // For the second profiles call (insert)
      mockSupabase._responses['profiles-insert'] = { data: null, error: null };
      mockSupabase.mockResponseFor('org_relationships', { data: null, error: null });
      
      // Override insert implementation for profiles
      const originalInsert = mockSupabase.insert;
      mockSupabase.insert.mockImplementation(function(data) {
        if (this.currentTable === 'profiles' && data.id === 'new-profile-123') {
          return { 
            ...mockSupabase,
            then: (callback) => Promise.resolve(callback({ data: null, error: null }))
          };
        }
        return originalInsert.call(this, data);
      });

      // Call the API function
      const result = await organizationRelationshipsApi.addOrganizationRelationship(newProfileRelationship);

      // Check if profile was created
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      
      // Check if relationship was created
      expect(mockSupabase.from).toHaveBeenCalledWith('org_relationships');

      // Check the result
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
    });
  });

  describe('updateOrganizationRelationship', () => {
    const relationshipId = 'rel-1';
    const updateData = {
      connection_type: 'former',
      department: 'Marketing',
      notes: 'Updated notes'
    };

    test('should update organization relationship successfully', async () => {
      // Set up mock response
      mockSupabase.mockResponseFor('org_relationships', { data: null, error: null });

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
      mockSupabase.mockResponseFor('org_relationships', { 
        data: null, 
        error: { message: 'Database error' } 
      });
      
      // Call the API function and expect it to throw
      await expect(organizationRelationshipsApi.updateOrganizationRelationship(relationshipId, updateData))
        .rejects.toEqual({ message: 'Database error' });
    }, 10000); // Increase timeout for this test
  });

  describe('deleteOrganizationRelationship', () => {
    const relationshipId = 'rel-1';

    test('should delete organization relationship successfully', async () => {
      // Set up mock response
      mockSupabase.mockResponseFor('org_relationships', { data: null, error: null });

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
      mockSupabase.mockResponseFor('org_relationships', { 
        data: null, 
        error: { message: 'Database error' } 
      });
      
      // Call the API function and expect it to throw
      await expect(organizationRelationshipsApi.deleteOrganizationRelationship(relationshipId))
        .rejects.toEqual({ message: 'Database error' });
    }, 10000); // Increase timeout for this test
  });
});
