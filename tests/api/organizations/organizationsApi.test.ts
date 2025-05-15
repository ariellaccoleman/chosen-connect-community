
import { organizationCrudApi } from '@/api/organizations/organizationsApi';
import { mockSupabase, resetSupabaseMocks } from '../../__mocks__/supabase';
import { Organization } from '@/types';

describe('Organization CRUD API', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  describe('getAllOrganizations', () => {
    test('should return all organizations with formatted locations', async () => {
      // Mock the Supabase query response
      const mockOrgs = [
        { 
          id: 'org-1', 
          name: 'Test Org 1',
          location: { id: 'loc-1', city: 'New York', country: 'USA' } 
        },
        { 
          id: 'org-2', 
          name: 'Test Org 2',
          location: null
        }
      ];

      // Setup mock implementation
      mockSupabase.from.mockImplementation(function(table) {
        expect(table).toBe('organizations');
        return this;
      });
      
      mockSupabase.select.mockImplementation(function() {
        return this;
      });
      
      mockSupabase.order.mockImplementation(function() {
        return Promise.resolve({
          data: mockOrgs,
          error: null
        });
      });

      // Call the API method
      const result = await organizationCrudApi.getAllOrganizations();

      // Check if Supabase query was called correctly
      expect(mockSupabase.from).toHaveBeenCalledWith('organizations');
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.order).toHaveBeenCalledWith('name');

      // Check the result
      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].id).toBe('org-1');
      expect(result.data?.[1].id).toBe('org-2');
    });

    test('should handle errors when fetching organizations', async () => {
      // Mock an error response
      const errorMessage = 'Database error';
      
      mockSupabase.from.mockImplementation(function() {
        return this;
      });
      
      mockSupabase.select.mockImplementation(function() {
        return this;
      });
      
      mockSupabase.order.mockImplementation(function() {
        return Promise.reject({ message: errorMessage, code: 'PGRST' });
      });

      // Call the API method and expect it to throw
      await expect(organizationCrudApi.getAllOrganizations()).rejects.toEqual(
        expect.objectContaining({ message: errorMessage })
      );
    });
  });

  describe('getOrganizationById', () => {
    test('should return the organization with formatted location when found', async () => {
      const mockOrg = { 
        id: 'org-1', 
        name: 'Test Org',
        location: { id: 'loc-1', city: 'New York', country: 'USA' } 
      };

      mockSupabase.from.mockImplementation(function() {
        return this;
      });
      
      mockSupabase.select.mockImplementation(function() {
        return this;
      });
      
      mockSupabase.eq.mockImplementation(function() {
        return this;
      });
      
      mockSupabase.maybeSingle.mockImplementation(function() {
        return Promise.resolve({
          data: mockOrg,
          error: null
        });
      });

      // Call the API method
      const result = await organizationCrudApi.getOrganizationById('org-1');

      // Check if Supabase query was called correctly
      expect(mockSupabase.from).toHaveBeenCalledWith('organizations');
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'org-1');
      expect(mockSupabase.maybeSingle).toHaveBeenCalled();

      // Check the result
      expect(result.status).toBe('success');
      expect(result.data?.id).toBe('org-1');
      expect(result.data?.name).toBe('Test Org');
      expect(result.data?.location).toBeDefined();
    });

    test('should return null when organization is not found', async () => {
      mockSupabase.from.mockImplementation(function() {
        return this;
      });
      
      mockSupabase.select.mockImplementation(function() {
        return this;
      });
      
      mockSupabase.eq.mockImplementation(function() {
        return this;
      });
      
      mockSupabase.maybeSingle.mockImplementation(function() {
        return Promise.resolve({
          data: null,
          error: null
        });
      });

      // Call the API method
      const result = await organizationCrudApi.getOrganizationById('non-existent-id');

      // Check the result
      expect(result.status).toBe('success');
      expect(result.data).toBeNull();
    });

    test('should return null when id is falsy', async () => {
      // Call the API method with undefined id
      const result = await organizationCrudApi.getOrganizationById(undefined);

      // The API should early return without calling Supabase
      expect(mockSupabase.from).not.toHaveBeenCalled();
      expect(result.status).toBe('success');
      expect(result.data).toBeNull();
    });
  });
});
