import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Organization } from '@/types';
import { organizationCrudApi } from '@/api/organizations';

/**
 * Hook for creating a new organization
 */
export const useCreateOrganization = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Organization>) => organizationCrudApi.create(data),
    onSuccess: () => {
      // Invalidate queries to refetch organization data
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
};

/**
 * Hook for updating an existing organization
 */
export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Organization> }) =>
      organizationCrudApi.update(id, data),
    onSuccess: () => {
      // Invalidate queries to refetch organization data
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
};

/**
 * Hook for deleting an organization
 */
export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => organizationCrudApi.delete(id),
    onSuccess: () => {
      // Invalidate queries to refetch organization data
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
};
