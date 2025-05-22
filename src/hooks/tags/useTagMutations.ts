
/**
 * Tag Mutation Hooks
 * Provides hooks for tag CRUD operations
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { tagApi } from '@/api/tags';
import { logger } from '@/utils/logger';

/**
 * Hook for tag creation
 */
export function useCreateTag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Tag>) => {
      logger.debug("Creating tag:", data);
      return tagApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
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
      return tagApi.update(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["tags", "byId", variables.id] });
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
      return tagApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    }
  });
}

/**
 * Hook for finding or creating a tag
 */
export function useFindOrCreateTag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      data, 
      entityType 
    }: { 
      data: Partial<Tag>; 
      entityType?: EntityType 
    }) => {
      logger.debug(`Finding or creating tag:`, data);
      return tagApi.findOrCreate(data, entityType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
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
