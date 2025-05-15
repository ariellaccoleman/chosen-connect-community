
import { organizationRelationshipsApi } from '@/api/organizations/relationshipsApi';
import { mockSupabase, resetSupabaseMocks } from '../../__mocks__/supabase';
import { createSuccessResponse, createErrorResponse } from '@/api/core/errorHandler';
import { ProfileOrganizationRelationshipWithDetails } from '@/types';

// Mock the apiClient module
jest.mock('@/api/core/apiClient', () => ({
  apiClient: {
    query: jest.fn(async (callback) => {
      try {
        return await callback(mockSupabase);
      } catch (error) {
        return createErrorResponse(error);
      }
    })
  }
}));

// Mock the logger to avoid console noise during tests
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock the formatters to return predictable data
jest.mock('@/utils/organizationFormatters', () => ({
  formatOrganizationRelationships: jest.fn((data) => 
    data.map((item: any) => ({
      id: item.id,
      profile_id: item.profile_id,
      organization_id: item.organization_id,
      connection_type: item.connection_type,
      department: item.department,
      notes: item.notes,
      organization: item.organization || { name: 'Mocked Org' }
    }))
  )
}));

describe('Organization Relationships API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    resetSupabaseMocks();
    jest.clearAllMocks();
  });

  describe('getUserOrganizationRelationships', () => {
    test('should return organization relationships with formatted data', async () => {
      // Setup mock response
      const mockRelationship = {
        id: 'rel-1',
        profile_id: 'profile-1',
        organization_id: 'org-1',
        connection_type: 'Current employee',
        department: 'Engineering',
        notes: 'Test notes',
        organization: {
          id: 'org-1',
          name: 'Test Org',
          location: {
            id: 'loc-1',
            city: 'Test City'
          }
        }
      };
      
      mockSupabase.from.mockImplementation(() => mockSupabase);
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.then.mockImplementation((callback) => {
        return Promise.resolve(callback({ 
          data: [mockRelationship], 
          error: null 
        }));
      });
      
      // Call the function
      const result = await organizationRelationshipsApi.getUserOrganizationRelationships('profile-1');
      
      // Verify result
      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('rel-1');
      expect(result.data[0].organization.name).toBe('Test Org');
    }, 10000);

    test('should handle errors when fetching relationships', async () => {
      // Mock error response
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Call the function and expect it to throw
      let result;
      let error;
      
      try {
        result = await organizationRelationshipsApi.getUserOrganizationRelationships('profile-1');
      } catch (e) {
        error = e;
      }
      
      // Check if error was handled correctly
      expect(result.status).toBe('error');
      expect(result.error.message).toBe('Database error');
    }, 10000);
  });

  describe('addOrganizationRelationship', () => {
    test('should create a relationship successfully', async () => {
      // Setup mock responses for profile check and insert
      const relationshipData = {
        profile_id: 'profile-1',
        organization_id: 'org-1',
        connection_type: 'Current employee',
        department: 'Engineering'
      };
      
      let callCount = 0;
      mockSupabase.from.mockImplementation((table) => {
        mockSupabase.currentTable = table;
        return mockSupabase;
      });
      
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.maybeSingle.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          data: { id: 'profile-1' }, // Profile exists
          error: null
        });
      });
      
      mockSupabase.insert.mockImplementation(() => {
        return Promise.resolve({
          data: { id: 'rel-1' },
          error: null
        });
      });
      
      // Call the function
      const result = await organizationRelationshipsApi.addOrganizationRelationship(relationshipData);
      
      // Verify result
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
      
      // Verify correct tables were queried
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.from).toHaveBeenCalledWith('org_relationships');
      
      // Verify correct data was inserted
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        profile_id: 'profile-1',
        organization_id: 'org-1',
        connection_type: 'Current employee'
      }));
    }, 10000);
    
    test('should create profile if it doesn\'t exist', async () => {
      // Setup mock responses - profile doesn't exist
      const relationshipData = {
        profile_id: 'new-profile',
        organization_id: 'org-1',
        connection_type: 'Current employee'
      };
      
      // Mock sequence: check profile (not found) -> create profile -> create relationship
      let callCount = 0;
      mockSupabase.from.mockImplementation((table) => {
        mockSupabase.currentTable = table;
        return mockSupabase;
      });
      
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.maybeSingle.mockImplementation(() => {
        return Promise.resolve({
          data: null, // Profile doesn't exist
          error: null
        });
      });
      
      mockSupabase.insert.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call is to create profile
          return Promise.resolve({
            data: { id: 'new-profile' },
            error: null
          });
        } else {
          // Second call is to create relationship
          return Promise.resolve({
            data: { id: 'rel-new' },
            error: null
          });
        }
      });
      
      // Call the function
      const result = await organizationRelationshipsApi.addOrganizationRelationship(relationshipData);
      
      // Verify result
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
      
      // Verify profile was created
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.insert).toHaveBeenCalledWith({ id: 'new-profile' });
      
      // Verify relationship was created
      expect(mockSupabase.from).toHaveBeenCalledWith('org_relationships');
    }, 10000);
  });

  describe('updateOrganizationRelationship', () => {
    test('should update relationship successfully', async () => {
      // Setup mock
      mockSupabase.from.mockImplementation((table) => {
        mockSupabase.currentTable = table;
        return mockSupabase;
      });
      
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockImplementation(() => {
        return Promise.resolve({
          data: { id: 'rel-1' },
          error: null
        });
      });
      
      const updateData = {
        connection_type: 'Former employee',
        department: 'Marketing',
        notes: 'Updated notes'
      };
      
      // Call the function
      const result = await organizationRelationshipsApi.updateOrganizationRelationship('rel-1', updateData);
      
      // Verify result
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
      
      // Verify correct update was called
      expect(mockSupabase.from).toHaveBeenCalledWith('org_relationships');
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
        connection_type: 'Former employee',
        department: 'Marketing',
        notes: 'Updated notes'
      }));
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'rel-1');
    }, 10000);
    
    test('should handle errors when updating relationship', async () => {
      // Mock error response
      mockSupabase.from.mockImplementation((table) => {
        mockSupabase.currentTable = table;
        return mockSupabase;
      });
      
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Call the function
      const result = await organizationRelationshipsApi.updateOrganizationRelationship('rel-1', {
        connection_type: 'Former employee'
      });
      
      // Verify error handling
      expect(result.status).toBe('error');
      expect(result.error.message).toBe('Database error');
    }, 10000);
  });

  describe('deleteOrganizationRelationship', () => {
    test('should delete relationship successfully', async () => {
      // Setup mock
      mockSupabase.from.mockImplementation((table) => {
        mockSupabase.currentTable = table;
        return mockSupabase;
      });
      
      mockSupabase.delete.mockReturnThis();
      mockSupabase.eq.mockImplementation(() => {
        return Promise.resolve({
          data: null,
          error: null
        });
      });
      
      // Call the function
      const result = await organizationRelationshipsApi.deleteOrganizationRelationship('rel-1');
      
      // Verify result
      expect(result.status).toBe('success');
      expect(result.data).toBe(true);
      
      // Verify correct delete was called
      expect(mockSupabase.from).toHaveBeenCalledWith('org_relationships');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'rel-1');
    }, 10000);
    
    test('should handle errors when deleting relationship', async () => {
      // Mock error response
      mockSupabase.from.mockImplementation((table) => {
        mockSupabase.currentTable = table;
        return mockSupabase;
      });
      
      mockSupabase.delete.mockReturnThis();
      mockSupabase.eq.mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Call the function
      const result = await organizationRelationshipsApi.deleteOrganizationRelationship('rel-1');
      
      // Verify error handling
      expect(result.status).toBe('error');
      expect(result.error.message).toBe('Database error');
    }, 10000);
  });
});
