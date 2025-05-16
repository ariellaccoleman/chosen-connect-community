
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag } from '@/utils/tags/types';
import { fetchTags, fetchFilterTags, createTag, findOrCreateTag } from '@/utils/tags/tagOperations';
import { createMutationHandlers } from '@/utils/toastUtils';
import { invalidateTagCache } from '@/api/tags/cacheApi';

/**
 * Hook for fetching tags that can be used for selection (both entity-specific and general tags)
 */
export const useSelectionTags = (options: {
  type?: string;
  createdBy?: string;
  searchQuery?: string;
  targetType?: string;
  enabled?: boolean;
  skipCache?: boolean;
} = {}) => {
  const { enabled = true, ...fetchOptions } = options;
  
  return useQuery({
    queryKey: ['tags', 'selection', fetchOptions],
    queryFn: () => fetchTags(fetchOptions),
    enabled
  });
};

/**
 * Hook for fetching tags that are used for filtering (only assigned tags)
 */
export const useFilterTags = (options: {
  type?: string;
  createdBy?: string;
  searchQuery?: string;
  targetType?: string;
  enabled?: boolean;
} = {}) => {
  const { enabled = true, ...fetchOptions } = options;
  
  return useQuery({
    queryKey: ['tags', 'filter', fetchOptions],
    queryFn: () => fetchFilterTags(fetchOptions),
    enabled
  });
};

/**
 * Hook for creating a new tag
 */
export const useCreateTag = () => {
  const queryClient = useQueryClient();
  const toastHandlers = createMutationHandlers({
    successMessage: 'Tag created successfully',
    errorMessagePrefix: 'Failed to create tag'
  });
  
  return useMutation({
    mutationFn: (data: Partial<Tag>) => createTag(data),
    onSuccess: async (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      await invalidateTagCache();
      
      // Show success toast
      toastHandlers.onSuccess(data);
    },
    onError: (error) => toastHandlers.onError(error)
  });
};

/**
 * Hook for finding or creating a tag
 */
export const useFindOrCreateTag = () => {
  const queryClient = useQueryClient();
  const toastHandlers = createMutationHandlers({
    successMessage: 'Tag found or created successfully',
    errorMessagePrefix: 'Failed to find or create tag'
  });
  
  return useMutation({
    mutationFn: (data: Partial<Tag>) => findOrCreateTag(data),
    onSuccess: async (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      await invalidateTagCache();
      
      // Show success toast
      toastHandlers.onSuccess(data);
    },
    onError: (error) => toastHandlers.onError(error)
  });
};

// For backward compatibility
export const useTags = useSelectionTags;
