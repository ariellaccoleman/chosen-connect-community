
/**
 * Tag Mutation Hooks
 * Provides hooks for tag CRUD operations
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { createTag, updateTag, deleteTag, findOrCreateTag } from '@/utils/tags/tagOperations';
import { logger } from '@/utils/logger';

/**
 * Hook for tag creation
 */
export function useCreateTag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Tag>) => {
      logger.debug("Creating tag:", data);
      return createTag(data);
    },
    onSuccess: (result) => {
      if (result) {
        logger.debug("Tag created successfully:", result);
        queryClient.invalidateQueries({ queryKey: ["tags"] });
      }
    },
    onError: (error) => {
      logger.error("Failed to create tag:", error);
    }
  });
}

/**
 * Hook for updating a tag
 */
export function useUpdateTag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tag> }) => {
      logger.debug(`Updating tag ${id}:`, data);
      return updateTag(id, data);
    },
    onSuccess: (result, variables) => {
      if (result) {
        logger.debug("Tag updated successfully:", result);
        queryClient.invalidateQueries({ queryKey: ["tags"] });
        queryClient.invalidateQueries({ queryKey: ["tags", "byId", variables.id] });
      }
    },
    onError: (error) => {
      logger.error("Failed to update tag:", error);
    }
  });
}

/**
 * Hook for deleting a tag
 */
export function useDeleteTag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => {
      logger.debug(`Deleting tag ${id}`);
      return deleteTag(id);
    },
    onSuccess: (result, id) => {
      if (result) {
        logger.debug(`Tag ${id} deleted successfully`);
        queryClient.invalidateQueries({ queryKey: ["tags"] });
      }
    },
    onError: (error) => {
      logger.error("Failed to delete tag:", error);
    }
  });
}

/**
 * Hook for finding or creating a tag
 * No longer needs to handle user ID since triggers handle it automatically
 */
export function useFindOrCreateTag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      data
    }: { 
      data: Partial<Tag>; 
    }) => {
      logger.debug(`Finding or creating tag:`, data);
      return findOrCreateTag(data);
    },
    onSuccess: (result) => {
      if (result) {
        logger.debug("Tag found/created successfully:", result);
        queryClient.invalidateQueries({ queryKey: ["tags"] });
      }
    },
    onError: (error) => {
      logger.error("Failed to find or create tag:", error);
    }
  });
}

/**
 * Hook for tag CRUD operations (combined)
 */
export function useTagCrudMutations() {
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();
  
  return {
    createTag: createTag.mutate,
    updateTag: updateTag.mutate,
    deleteTag: deleteTag.mutate,
    isCreating: createTag.isPending,
    isUpdating: updateTag.isPending,
    isDeleting: deleteTag.isPending,
    error: createTag.error || updateTag.error || deleteTag.error
  };
}
