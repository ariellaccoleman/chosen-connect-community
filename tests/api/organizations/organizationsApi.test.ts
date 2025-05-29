import { organizationCrudApi } from '@/api/organizations/organizationsApi';
import { resetSupabaseMocks } from '../../__mocks__/supabase';
import * as repoFactory from '@/api/core/repository/repositoryFactory';
import { createMockRepository } from '@/api/core/repository/MockRepository';

// Mock the repository factory
jest.mock('@/api/core/repository/repositoryFactory', () => ({
  createRepository: jest.fn()
}));

describe.skip('Organization CRUD API', () => {
  let mockRepo: any;

  beforeEach(() => {
    resetSupabaseMocks();
    
    // Create a new mock repository for each test
    mockRepo = createMockRepository('organizations');
    
    // Configure the mock repository factory to return our mock
    jest.spyOn(repoFactory, 'createRepository').mockImplementation(() => mockRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllOrganizations', () => {
    test('should return all organizations with formatted locations', async () => {
      // Mock repository response
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

      // Set up mock implementation for the repository
      mockRepo.setMockResponse('select', {
        data: mockOrgs,
        error: null
      });

      // Call the API method
      const result = await organizationCrudApi.getAllOrganizations();

      // Check if repository was called correctly
      expect(repoFactory.createRepository).toHaveBeenCalledWith('organizations');

      // Check the result
      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].id).toBe('org-1');
      expect(result.data?.[1].id).toBe('org-2');
    });

    test('should handle errors when fetching organizations', async () => {
      // Mock an error response
      const errorMessage = 'Database error';
      
      mockRepo.setMockResponse('select', {
        data: null,
        error: new Error(errorMessage)
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

      mockRepo.setMockResponse('select_maybeSingle', {
        data: mockOrg,
        error: null
      });

      // Call the API method
      const result = await organizationCrudApi.getOrganizationById('org-1');

      // Check if repository was called correctly
      expect(repoFactory.createRepository).toHaveBeenCalledWith('organizations');

      // Check the result
      expect(result.status).toBe('success');
      expect(result.data?.id).toBe('org-1');
      expect(result.data?.name).toBe('Test Org');
      expect(result.data?.location).toBeDefined();
    });

    test('should return null when organization is not found', async () => {
      mockRepo.setMockResponse('select_maybeSingle', {
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

      // The API should early return without calling repository
      expect(repoFactory.createRepository).not.toHaveBeenCalled();
      expect(result.status).toBe('success');
      expect(result.data).toBeNull();
    });
  });
});
