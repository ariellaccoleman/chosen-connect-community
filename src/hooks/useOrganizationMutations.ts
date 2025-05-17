import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Organization, ProfileOrganizationRelationship } from '@/types';
import { 
  createOrganization, 
  updateOrganization, 
  deleteOrganization 
} from '@/api/organizations/organizationApiFactory';
import { organizationRelationshipsApi } from '@/api/organizations/relationshipsApi';
import { createMutationHandlers } from '@/utils/toastUtils';

/**
 * Hook for creating a new organization
 */
export const useCreateOrganization = () => {
  const queryClient = useQueryClient();
  const toastHandlers = createMutationHandlers({
    successMessage: "Organization created successfully!",
    errorMessagePrefix: "Failed to create organization"
  });
  
  return useMutation({
    mutationFn: ({ data, userId }: { data: Partial<Organization>; userId?: string }) => 
      createOrganization(data),  // Fix here: removed the second argument
    onSuccess: (data) => {
      // Invalidate queries to refetch organization data
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toastHandlers.onSuccess(data);
    },
    onError: toastHandlers.onError
  });
};

/**
 * Hook for updating an existing organization
 */
export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  const toastHandlers = createMutationHandlers({
    successMessage: "Organization updated successfully!",
    errorMessagePrefix: "Failed to update organization"
  });
  
  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: Partial<Organization> }) => {
      // Ensure updated_at is included in the data
      const updatedData = {
        ...data,
        updated_at: new Date().toISOString()
      };
      return updateOrganization(orgId, updatedData);
    },
    onSuccess: () => {
      // Invalidate queries to refetch organization data
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toastHandlers.onSuccess(null);
    },
    onError: toastHandlers.onError
  });
};

/**
 * Hook for deleting an organization
 */
export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();
  const toastHandlers = createMutationHandlers({
    successMessage: "Organization deleted successfully!",
    errorMessagePrefix: "Failed to delete organization"
  });
  
  return useMutation({
    mutationFn: (id: string) => deleteOrganization(id),
    onSuccess: () => {
      // Invalidate queries to refetch organization data
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toastHandlers.onSuccess(null);
    },
    onError: toastHandlers.onError
  });
};

/**
 * Hook to add an organization relationship
 */
export const useAddOrganizationRelationship = () => {
  const queryClient = useQueryClient();
  const toastHandlers = createMutationHandlers({
    successMessage: "Successfully added organization connection",
    errorMessagePrefix: "Failed to add organization connection"
  });
  
  return useMutation({
    mutationFn: (relationship: Partial<ProfileOrganizationRelationship>) => 
      organizationRelationshipsApi.addOrganizationRelationship(relationship),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["organization-relationships", variables.profile_id] });
      toastHandlers.onSuccess(null);
    },
    onError: toastHandlers.onError
  });
};

/**
 * Hook to update an organization relationship
 */
export const useUpdateOrganizationRelationship = () => {
  const queryClient = useQueryClient();
  const toastHandlers = createMutationHandlers({
    successMessage: "Successfully updated organization connection",
    errorMessagePrefix: "Failed to update organization connection"
  });
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProfileOrganizationRelationship> }) => 
      organizationRelationshipsApi.updateOrganizationRelationship(id, data),
    onSuccess: () => {
      // Since we don't know the profile_id here, invalidate all relationship queries
      queryClient.invalidateQueries({ queryKey: ["organization-relationships"] });
      toastHandlers.onSuccess(null);
    },
    onError: toastHandlers.onError
  });
};

/**
 * Hook to delete an organization relationship
 */
export const useDeleteOrganizationRelationship = () => {
  const queryClient = useQueryClient();
  const toastHandlers = createMutationHandlers({
    successMessage: "Organization connection removed successfully",
    errorMessagePrefix: "Failed to remove organization connection"
  });
  
  return useMutation({
    mutationFn: (id: string) => organizationRelationshipsApi.deleteOrganizationRelationship(id),
    onSuccess: () => {
      // Since we don't know the profile_id here, invalidate all relationship queries
      queryClient.invalidateQueries({ queryKey: ["organization-relationships"] });
      toastHandlers.onSuccess(null);
    },
    onError: toastHandlers.onError
  });
};
