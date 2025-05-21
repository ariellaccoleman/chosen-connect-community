
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Hub, HubWithTag, CreateHubDto } from '@/types/hub';
import { getAllHubs, getFeaturedHubs, getHubById, createHub, updateHub, toggleHubFeatured, deleteHub } from '@/api/hubs';
import { logger } from '@/utils/logger';

/**
 * Hook to fetch all hubs
 */
export const useHubs = () => {
  return useQuery({
    queryKey: ['hubs'],
    queryFn: async () => {
      const response = await getAllHubs();
      if (response.error) throw response.error;
      return response.data;
    }
  });
};

/**
 * Hook to fetch featured hubs
 */
export const useFeaturedHubs = () => {
  return useQuery({
    queryKey: ['hubs', 'featured'],
    queryFn: async () => {
      const response = await getFeaturedHubs();
      if (response.error) throw response.error;
      return response.data;
    }
  });
};

/**
 * Hook to fetch a single hub by ID
 */
export const useHub = (hubId: string | null) => {
  return useQuery({
    queryKey: ['hubs', hubId],
    queryFn: async () => {
      if (!hubId) return null;
      const response = await getHubById(hubId);
      if (response.error) throw response.error;
      return response.data;
    },
    enabled: !!hubId
  });
};

/**
 * Hook for hub mutation operations (admin only)
 */
export const useHubMutations = () => {
  const queryClient = useQueryClient();

  // Create hub mutation
  const createHubMutation = useMutation({
    mutationFn: (newHub: CreateHubDto) => createHub(newHub),
    onSuccess: () => {
      toast.success('Hub created successfully');
      queryClient.invalidateQueries({ queryKey: ['hubs'] });
    },
    onError: (error) => {
      logger.error('Failed to create hub:', error);
      toast.error(`Failed to create hub: ${error.message || 'Unknown error'}`);
    }
  });

  // Update hub mutation
  const updateHubMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Hub> }) => updateHub(id, data),
    onSuccess: () => {
      toast.success('Hub updated successfully');
      queryClient.invalidateQueries({ queryKey: ['hubs'] });
    },
    onError: (error) => {
      logger.error('Failed to update hub:', error);
      toast.error(`Failed to update hub: ${error.message || 'Unknown error'}`);
    }
  });

  // Toggle featured status mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) => 
      toggleHubFeatured(id, isFeatured),
    onSuccess: (_, variables) => {
      toast.success(`Hub ${variables.isFeatured ? 'featured' : 'unfeatured'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['hubs'] });
    },
    onError: (error) => {
      logger.error('Failed to toggle hub featured status:', error);
      toast.error(`Failed to update hub: ${error.message || 'Unknown error'}`);
    }
  });

  // Delete hub mutation
  const deleteHubMutation = useMutation({
    mutationFn: (id: string) => deleteHub(id),
    onSuccess: () => {
      toast.success('Hub deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['hubs'] });
    },
    onError: (error) => {
      logger.error('Failed to delete hub:', error);
      toast.error(`Failed to delete hub: ${error.message || 'Unknown error'}`);
    }
  });

  return {
    createHub: createHubMutation.mutate,
    updateHub: updateHubMutation.mutate,
    toggleFeatured: toggleFeaturedMutation.mutate,
    deleteHub: deleteHubMutation.mutate,
    isCreating: createHubMutation.isPending,
    isUpdating: updateHubMutation.isPending,
    isTogglingFeatured: toggleFeaturedMutation.isPending,
    isDeleting: deleteHubMutation.isPending
  };
};
