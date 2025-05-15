import { organizationCrudApi } from '@/api/organizations/organizationsApi';
import { mockSupabase, resetSupabaseMocks } from '../../__mocks__/supabase';
import { ApiResponse } from '@/api/core/errorHandler';
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
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: mockOrgs,
        error: null
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
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.order.mockRejectedValue({
        message: 'Database error', 
        code: 'PGRST'
      });

      // Call the API method
      let error;
      try {
        await organizationCrudApi.getAllOrganizations();
      } catch (e) {
        error = e;
      }

      // Check if error was thrown
      expect(error).toBeDefined();
      expect(error.message).toBe('Database error');
    });
  });

  describe('getOrganizationById', () => {
    test('should return the organization with formatted location when found', async () => {
      const mockOrg = { 
        id: 'org-1', 
        name: 'Test Org',
        location: { id: 'loc-1', city: 'New York', country: 'USA' } 
      };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.maybeSingle.mockResolvedValue({
        data: mockOrg,
        error: null
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
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null
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

    test('should handle errors when fetching an organization', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.maybeSingle.mockRejectedValue({
        message: 'Database error', 
        code: 'PGRST'
      });

      // Call the API method
      let error;
      try {
        await organizationCrudApi.getOrganizationById('org-1');
      } catch (e) {
        error = e;
      }

      // Check if error was thrown
      expect(error).toBeDefined();
      expect(error.message).toBe('Database error');
    });
  });

  describe('createOrganization', () => {
    test('should create organization and relationships successfully', async () => {
      const orgData = { 
        name: 'New Test Org',
        description: 'Test description',
        website_url: 'https://test.org'
      };
      
      const userId = 'user-123';
      const createdOrg = { ...orgData, id: 'new-org-id' };

      // Setup mocks for all required interactions
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.maybeSingle.mockResolvedValue({ 
        data: { id: userId }, 
        error: null 
      });
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue({
        data: createdOrg,
        error: null
      });

      // Call the API method
      const result = await organizationCrudApi.createOrganization(orgData, userId);

      // Verify the result
      expect(result.status).toBe('success');
      expect(result.data).toEqual(createdOrg);
      
      // Check if all necessary operations were called
      expect(mockSupabase.from).toHaveBeenCalledWith('organizations');
      expect(mockSupabase.from).toHaveBeenCalledWith('organization_admins');
      expect(mockSupabase.from).toHaveBeenCalledWith('org_relationships');
      expect(mockSupabase.insert).toHaveBeenCalledTimes(3);
    });

    test('should create a profile if it does not exist', async () => {
      const orgData = { name: 'New Test Org' };
      const userId = 'new-user-123';
      const createdOrg = { ...orgData, id: 'new-org-id' };

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
        if (mockSupabase.currentTable === 'profiles') {
          return Promise.resolve({ data: { id: userId }, error: null });
        } else if (mockSupabase.currentTable === 'organizations') {
          return mockSupabase;
        }
        return Promise.resolve({ data: null, error: null });
      });
      
      // Mock org creation
      mockSupabase.select.mockImplementation(() => mockSupabase);
      mockSupabase.single.mockResolvedValue({
        data: createdOrg,
        error: null
      });

      // Call the API method
      const result = await organizationCrudApi.createOrganization(orgData, userId);

      // Check if profile was created
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.insert).toHaveBeenCalledWith({ id: userId });
    });

    test('should handle errors during organization creation', async () => {
      const orgData = { name: 'New Test Org' };
      const userId = 'user-123';

      // Mock profile check
      mockSupabase.from.mockImplementation(() => mockSupabase);
      mockSupabase.select.mockImplementation(() => mockSupabase);
      mockSupabase.eq.mockImplementation(() => mockSupabase);
      mockSupabase.maybeSingle.mockResolvedValue({
        data: { id: userId },
        error: null
      });

      // Mock organization insert with error
      mockSupabase.insert.mockImplementation(() => mockSupabase);
      mockSupabase.select.mockImplementation(() => mockSupabase);
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'PGRST' }
      });

      // Call the API method
      let error;
      try {
        await organizationCrudApi.createOrganization(orgData, userId);
      } catch (e) {
        error = e;
      }

      // Check if error was thrown
      expect(error).toBeDefined();
      expect(error.message).toBe('Database error');
    });
  });

  describe('updateOrganization', () => {
    test('should update organization successfully', async () => {
      const orgId = 'org-1';
      const updateData = { 
        name: 'Updated Org Name', 
        description: 'Updated description' 
      };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: null
      });

      // Call the API method
      const result = await organizationCrudApi.updateOrganization(orgId, updateData);

      // Check if Supabase update was called correctly
      expect(mockSupabase.from).toHaveBeenCalledWith('organizations');
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', orgId);

      // Check the result
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
    });

    test('should handle errors when updating an organization', async () => {
      const orgId = 'org-1';
      const updateData = { name: 'Updated Org Name' };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'PGRST' }
      });

      // Call the API method
      let error;
      try {
        await organizationCrudApi.updateOrganization(orgId, updateData);
      } catch (e) {
        error = e;
      }

      // Check if error was thrown
      expect(error).toBeDefined();
      expect(error.message).toBe('Database error');
    });
  });
});
