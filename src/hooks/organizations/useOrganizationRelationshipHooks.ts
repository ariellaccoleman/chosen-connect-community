
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationRelationshipsApi } from '@/api/organizations/relationshipsApi';
import { ProfileOrganizationRelationship } from '@/types';
import { toast } from '@/components/ui/sonner';
import { logger } from '@/utils/logger';

/**
 * Hook for adding a relationship between a profile and organization
 */
export const useAddOrganizationRelationship = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      profile_id: string;
      organization_id: string;
      connection_type: string;
      department?: string | null;
      notes?: string | null;
    }) => {
      return organizationRelationshipsApi.addOrganizationRelationship(data);
    },
    onSuccess: () => {
      toast.success("Successfully added organization connection");
      queryClient.invalidateQueries({ queryKey: ['organization-relationships'] });
    },
    onError: (error: Error) => {
      logger.error('Failed to add organization connection:', error);
      toast.error("Failed to add organization connection. Please try again.");
    }
  });
};

/**
 * Hook for updating a relationship
 */
export const useUpdateOrganizationRelationship = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      id,
      data
    }: {
      id: string;
      data: Partial<ProfileOrganizationRelationship>;
    }) => {
      return organizationRelationshipsApi.updateOrganizationRelationship(id, data);
    },
    onSuccess: () => {
      toast.success("Successfully updated organization connection");
      queryClient.invalidateQueries({ queryKey: ['organization-relationships'] });
    },
    onError: (error: Error) => {
      logger.error('Failed to update organization connection:', error);
      toast.error("Failed to update organization connection. Please try again.");
    }
  });
};

/**
 * Hook for deleting a relationship
 */
export const useDeleteOrganizationRelationship = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => {
      return organizationRelationshipsApi.deleteOrganizationRelationship(id);
    },
    onSuccess: () => {
      toast.success("Successfully removed organization connection");
      queryClient.invalidateQueries({ queryKey: ['organization-relationships'] });
    },
    onError: (error: Error) => {
      logger.error('Failed to delete organization connection:', error);
      toast.error("Failed to delete organization connection. Please try again.");
    }
  });
};
