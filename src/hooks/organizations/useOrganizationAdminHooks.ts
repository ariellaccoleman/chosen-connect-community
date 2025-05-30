
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrganizationAdminWithDetails, OrganizationAdmin } from '@/types';
import { createMutationHandlers } from '@/utils/toastUtils';
import {
  getAllOrganizationAdmins,
  getOrganizationAdminsByOrg,
  getUserAdminRequests,
  checkIsOrganizationAdmin,
  getOrganizationRole,
  createAdminRequest,
  updateAdminRequest,
  deleteAdminRequest
} from '@/api/organizations/organizationAdminApiFactory';

// Fetch all organization admin requests (for site admins)
export const useOrganizationAdmins = (filters: { status?: 'pending' | 'approved' | 'all' } = {}) => {
  return useQuery({
    queryKey: ['organization-admins', filters],
    queryFn: async (): Promise<OrganizationAdminWithDetails[]> => {
      const response = await getAllOrganizationAdmins(filters);
      if (response.error) {
        console.error('Error fetching organization admins:', response.error);
        return [];
      }
      return response.data || [];
    },
  });
};

// Fetch organization admins for a specific organization
export const useOrganizationAdminsByOrg = (organizationId: string | undefined) => {
  return useQuery({
    queryKey: ['organization-admins', 'organization', organizationId],
    queryFn: async (): Promise<OrganizationAdminWithDetails[]> => {
      if (!organizationId) return [];
      
      const response = await getOrganizationAdminsByOrg(organizationId, false);
      if (response.error) {
        console.error('Error fetching organization admins:', response.error);
        return [];
      }
      return response.data || [];
    },
    enabled: !!organizationId,
  });
};

// Fetch pending admin requests for a specific organization
export const usePendingOrganizationAdmins = (organizationId: string | undefined) => {
  return useQuery({
    queryKey: ['organization-admins', 'pending', organizationId],
    queryFn: async (): Promise<OrganizationAdminWithDetails[]> => {
      if (!organizationId) return [];
      
      const response = await getOrganizationAdminsByOrg(organizationId, true);
      if (response.error) {
        console.error('Error fetching pending organization admins:', response.error);
        return [];
      }
      // Filter to only pending requests
      const pendingAdmins = (response.data || []).filter(admin => !admin.is_approved);
      return pendingAdmins;
    },
    enabled: !!organizationId,
  });
};

// Check if user is admin for a specific organization
export const useIsOrganizationAdmin = (userId: string | undefined, organizationId: string | undefined) => {
  return useQuery({
    queryKey: ['is-organization-admin', userId, organizationId],
    queryFn: async (): Promise<boolean> => {
      if (!userId || !organizationId) return false;
      
      const response = await checkIsOrganizationAdmin(userId, organizationId);
      if (response.error) {
        console.error('Error checking if user is organization admin:', response.error);
        return false;
      }
      return response.data || false;
    },
    enabled: !!userId && !!organizationId,
  });
};

// Check if user has a specific role in an organization
export const useOrganizationRole = (userId: string | undefined, organizationId: string | undefined) => {
  return useQuery({
    queryKey: ['organization-role', userId, organizationId],
    queryFn: async (): Promise<string | null> => {
      if (!userId || !organizationId) return null;
      
      const response = await getOrganizationRole(userId, organizationId);
      if (response.error) {
        console.error('Error checking organization role:', response.error);
        return null;
      }
      return response.data;
    },
    enabled: !!userId && !!organizationId,
  });
};

// Fetch user's admin requests (for current user)
export const useUserAdminRequests = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-admin-requests', userId],
    queryFn: async (): Promise<OrganizationAdminWithDetails[]> => {
      if (!userId) return [];
      
      const response = await getUserAdminRequests(userId);
      if (response.error) {
        console.error('Error fetching user admin requests:', response.error);
        return [];
      }
      return response.data || [];
    },
    enabled: !!userId,
  });
};

// Create a new organization admin request
export const useCreateAdminRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: {
      profile_id: string;
      organization_id: string;
      role?: string;
    }) => {
      const response = await createAdminRequest(request);
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    ...createMutationHandlers({
      successMessage: 'Admin request created successfully',
      errorMessagePrefix: 'Error creating admin request',
      onSuccessCallback: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['user-admin-requests', variables.profile_id] });
        queryClient.invalidateQueries({ queryKey: ['organization-admins'] });
      }
    })
  });
};

// Update an organization admin request (approve/reject)
export const useUpdateAdminRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      requestId, 
      updates 
    }: { 
      requestId: string, 
      updates: Partial<OrganizationAdmin> 
    }) => {
      const response = await updateAdminRequest(requestId, updates);
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    ...createMutationHandlers({
      successMessage: 'Admin request updated successfully',
      errorMessagePrefix: 'Error updating admin request',
      onSuccessCallback: () => {
        queryClient.invalidateQueries({ queryKey: ['organization-admins'] });
        queryClient.invalidateQueries({ queryKey: ['user-admin-requests'] });
        queryClient.invalidateQueries({ queryKey: ['is-organization-admin'] });
      }
    })
  });
};

// Delete an organization admin request
export const useDeleteAdminRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await deleteAdminRequest(requestId);
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    ...createMutationHandlers({
      successMessage: 'Admin request deleted successfully',
      errorMessagePrefix: 'Error deleting admin request',
      onSuccessCallback: () => {
        queryClient.invalidateQueries({ queryKey: ['organization-admins'] });
        queryClient.invalidateQueries({ queryKey: ['user-admin-requests'] });
        queryClient.invalidateQueries({ queryKey: ['is-organization-admin'] });
      }
    })
  });
};
