
import { organizationRelationshipsApi } from '@/api/organizations/relationshipsApi';
import { mockSupabase, resetSupabaseMocks } from '../../__mocks__/supabase';
import { ProfileOrganizationRelationship } from '@/types';

describe('Organization Relationships API', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  describe('getUserOrganizationRelationships', () => {
    test('should return all relationships for a user', async () => {
      const profileId = 'profile-123';
      const mockRelationships = [
        {
          id: 'rel-1',
          profile_id: profileId,
          organization_id: 'org-1',
          connection_type: 'current',
          organization: {
            id: 'org-1',
            name: 'Test Org',
            location: { id: 'loc-1', city: 'New York' }
          }
        },
        {
          id: 'rel-2',
          profile_id: profileId,
          organization_id: 'org-2',
          connection_type: 'former',
          organization: {
            id: 'org-2',
            name: 'Former Org',
            location: null
          }
        }
      ];

      // Mock Supabase query
      mockSupabase.from.mockImplementation(() => mockSupabase);
      mockSupabase.select.mockImplementation(() => mockSupabase);
      mockSupabase.eq.mockResolvedValue({
        data: mockRelationships,
        error: null
      });

      // Call the API method
      const result = await organizationRelationshipsApi.getUserOrganizationRelationships(profileId);

      // Check if Supabase query was called correctly
      expect(mockSupabase.from).toHaveBeenCalledWith('org_relationships');
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('profile_id', profileId);

      // Check the result
      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data?.length).toBe(2);
    });

    test('should handle errors when fetching relationships', async () => {
      const profileId = 'profile-123';
      
      // Mock error response
      mockSupabase.from.mockImplementation(() => mockSupabase);
      mockSupabase.select.mockImplementation(() => mockSupabase);
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'PGRST' }
      });

      // Call the API method
      let error;
      try {
        await organizationRelationshipsApi.getUserOrganizationRelationships(profileId);
      } catch (e) {
        error = e;
      }

      // Check if error was thrown
      expect(error).toBeDefined();
      expect(error.message).toBe('Database error');
    });
  });

  describe('addOrganizationRelationship', () => {
    test('should create a relationship successfully', async () => {
      const relationship: Partial<ProfileOrganizationRelationship> = {
        profile_id: 'profile-123',
        organization_id: 'org-1',
        connection_type: 'current',
        department: 'Engineering'
      };

      // Mock profile check - profile exists
      mockSupabase.from.mockImplementation((table) => {
        mockSupabase.currentTable = table;
        return mockSupabase;
      });
      mockSupabase.select.mockImplementation(() => mockSupabase);
      mockSupabase.eq.mockImplementation(() => mockSupabase);
      mockSupabase.maybeSingle.mockResolvedValue({
        data: { id: relationship.profile_id },
        error: null
      });

      // Mock relationship insert
      mockSupabase.insert.mockImplementation(() => mockSupabase);
      mockSupabase.select.mockImplementation(() => mockSupabase);
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: null
      });

      // Call the API method
      const result = await organizationRelationshipsApi.addOrganizationRelationship(relationship);

      // Check if the relationship was created
      expect(mockSupabase.from).toHaveBeenCalledWith('org_relationships');
      expect(mockSupabase.insert).toHaveBeenCalled();
      
      // Check the result
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
    });

    test('should create a profile if it does not exist', async () => {
      const relationship: Partial<ProfileOrganizationRelationship> = {
        profile_id: 'new-profile-123',
        organization_id: 'org-1',
        connection_type: 'current'
      };

      // Mock profile check - profile doesn't exist
      mockSupabase.from.mockImplementation((table) => {
        mockSupabase.currentTable = table;
        return mockSupabase;
      });
      mockSupabase.select.mockImplementation(() => mockSupabase);
      mockSupabase.eq.mockImplementation(() => mockSupabase);
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null
      });

      // Mock profile creation
      mockSupabase.insert.mockImplementation(() => {
        return Promise.resolve({ data: null, error: null });
      });

      // Call the API method
      await organizationRelationshipsApi.addOrganizationRelationship(relationship);

      // Check if profile was created
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.insert).toHaveBeenCalledWith({ id: relationship.profile_id });
    });

    test('should throw error when profile_id is missing', async () => {
      const relationship: Partial<ProfileOrganizationRelationship> = {
        organization_id: 'org-1',
        connection_type: 'current'
      };

      // Call the API method
      let error;
      try {
        await organizationRelationshipsApi.addOrganizationRelationship(relationship);
      } catch (e) {
        error = e;
      }

      // Check if error was thrown
      expect(error).toBeDefined();
      expect(error.message).toBe('Profile ID is required');
    });
  });

  describe('updateOrganizationRelationship', () => {
    test('should update a relationship successfully', async () => {
      const relationshipId = 'rel-1';
      const updateData: Partial<ProfileOrganizationRelationship> = {
        connection_type: 'former',
        department: 'Marketing'
      };

      mockSupabase.from.mockImplementation(() => mockSupabase);
      mockSupabase.update.mockImplementation(() => mockSupabase);
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: null
      });

      // Call the API method
      const result = await organizationRelationshipsApi.updateOrganizationRelationship(relationshipId, updateData);

      // Check if Supabase update was called correctly
      expect(mockSupabase.from).toHaveBeenCalledWith('org_relationships');
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', relationshipId);

      // Check the result
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
    });
  });

  describe('deleteOrganizationRelationship', () => {
    test('should delete a relationship successfully', async () => {
      const relationshipId = 'rel-1';

      mockSupabase.from.mockImplementation(() => mockSupabase);
      mockSupabase.delete.mockImplementation(() => mockSupabase);
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: null
      });

      // Call the API method
      const result = await organizationRelationshipsApi.deleteOrganizationRelationship(relationshipId);

      // Check if Supabase delete was called correctly
      expect(mockSupabase.from).toHaveBeenCalledWith('org_relationships');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', relationshipId);

      // Check the result
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
    });
  });
});
