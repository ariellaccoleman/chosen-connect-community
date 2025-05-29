import { renderHook, waitFor } from '@testing-library/react';
import { 
  useCreateOrganization, 
  useUpdateOrganization, 
  useAddOrganizationRelationship 
} from '@/hooks/organizations';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as organizationApi from '@/api/organizations/organizationApiFactory';
import * as relationshipsApi from '@/api/organizations/relationshipsApi';
import { toast } from 'sonner';
import React from 'react';
import { ConnectionType } from '@/types';

// Mock the toast module
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock the API modules
jest.mock('@/api/organizations/organizationApiFactory');
jest.mock('@/api/organizations/relationshipsApi');

// Create a wrapper for react-query hooks
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe.skip('Organization Mutation Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useCreateOrganization', () => {
    test('should call createOrganization API and handle success', async () => {
      // Mock API response
      const mockCreateOrg = jest.spyOn(organizationApi, 'createOrganization')
        .mockResolvedValueOnce({ 
          data: { id: 'new-org-id', name: 'Test Org' }, 
          error: null, 
          status: 'success' 
        });

      // Render the hook
      const { result } = renderHook(() => useCreateOrganization(), {
        wrapper: createWrapper()
      });

      // Execute the mutation
      result.current.mutate({ name: 'Test Org', description: 'Test Description' });

      // Wait for the mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify API was called correctly
      expect(mockCreateOrg).toHaveBeenCalledWith(
        { name: 'Test Org', description: 'Test Description' }
      );

      // Verify toast was shown
      expect(toast.success).toHaveBeenCalledWith("Organization created successfully!");
    });

    test('should handle API errors', async () => {
      // Mock API error response
      const mockCreateOrg = jest.spyOn(organizationApi, 'createOrganization')
        .mockRejectedValueOnce(new Error('Failed to create organization'));

      // Render the hook
      const { result } = renderHook(() => useCreateOrganization(), {
        wrapper: createWrapper()
      });

      // Execute the mutation
      result.current.mutate({ name: 'Test Org' });

      // Wait for the mutation to complete
      await waitFor(() => expect(result.current.isError).toBe(true));

      // Verify error toast was shown with updated error message format
      expect(toast.error).toHaveBeenCalledWith("Failed to create Organization: Failed to create organization");
    });
  });

  describe('useAddOrganizationRelationship', () => {
    test('should call addOrganizationRelationship API and handle success', async () => {
      // Mock API response
      const mockAddRelationship = jest.spyOn(relationshipsApi.organizationRelationshipsApi, 'addOrganizationRelationship')
        .mockResolvedValueOnce({ 
          data: true, 
          error: null, 
          status: 'success' 
        });

      // Render the hook
      const { result } = renderHook(() => useAddOrganizationRelationship(), {
        wrapper: createWrapper()
      });

      // Execute the mutation
      const relationshipData = {
        profile_id: 'profile-123',
        organization_id: 'org-1',
        connection_type: 'current' as ConnectionType
      };
      result.current.mutate(relationshipData);

      // Wait for the mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify API was called correctly
      expect(mockAddRelationship).toHaveBeenCalledWith(relationshipData);

      // Verify toast was shown
      expect(toast.success).toHaveBeenCalledWith("Successfully added organization connection");
    });
  });

  describe('useUpdateOrganization', () => {
    test('should call updateOrganization API and handle success', async () => {
      // Mock API response
      const mockUpdateOrg = jest.spyOn(organizationApi, 'updateOrganization')
        .mockResolvedValueOnce({ 
          data: true, 
          error: null, 
          status: 'success' 
        });

      // Render the hook
      const { result } = renderHook(() => useUpdateOrganization(), {
        wrapper: createWrapper()
      });

      // Execute the mutation
      result.current.mutate({ 
        id: 'org-1',
        data: { 
          name: 'Updated Org',
          description: 'Updated Description'
        }
      });

      // Wait for the mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify API was called correctly - without checking for updated_at
      expect(mockUpdateOrg).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({
          name: 'Updated Org',
          description: 'Updated Description'
        })
      );

      // Verify toast was shown
      expect(toast.success).toHaveBeenCalledWith("Organization updated successfully!");
    });
  });
});
