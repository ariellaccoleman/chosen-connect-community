
import { createQueryHooks } from '@/hooks/core/factory';
import { hubApi, getFeaturedHubs, toggleHubFeatured } from '@/api/hubs';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Hub } from '@/types';

// Create hooks with the factory
export const hubHooks = createQueryHooks<Hub>(
  { 
    name: 'hub',
    pluralName: 'hubs',
    displayName: 'Hub',
    pluralDisplayName: 'Hubs'
  },
  hubApi
);

// Extract standard hooks
export const {
  useList: useHubs,
  useById: useHub,
  useCreate: useCreateHub,
  useUpdate: useUpdateHub,
  useDelete: useDeleteHub
} = hubHooks;

/**
 * Hook to fetch featured hubs
 */
export const useFeaturedHubs = () => {
  return useQuery({
    queryKey: ['hubs', 'featured'],
    queryFn: getFeaturedHubs
  });
};

/**
 * Hook to toggle a hub's featured status
 */
export const useToggleHubFeatured = () => {
  return useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) => 
      toggleHubFeatured(id, isFeatured),
    onSuccess: () => {
      // Access queryClient through the properly configured client
      return Promise.all([
        // Using the proper way to access queryClient
        // Use the global window.queryClient that's been set up in the app
        // @ts-ignore - queryClient is configured on window in the app's initialization
        window.queryClient?.invalidateQueries({ queryKey: ['hubs'] }),
        // @ts-ignore - queryClient is configured on window in the app's initialization
        window.queryClient?.invalidateQueries({ queryKey: ['hubs', 'featured'] })
      ]);
    }
  });
};
