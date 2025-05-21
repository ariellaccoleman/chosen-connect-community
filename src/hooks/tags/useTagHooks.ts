
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi } from '@/api/tags/tagsApi';
import { assignTag, removeTagAssignment } from '@/api/tags/assignmentApi';
import { getEntityTags, getEntitiesWithTag } from '@/api/tags/entityTagsApi';
import { EntityType, isValidEntityType } from '@/types/entityTypes';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import { Tag } from '@/types/tag';

/**
 * Hook to fetch tags for selection dropdowns
 */
export const useSelectionTags = (entityType?: EntityType) => {
  return useQuery({
    queryKey: ['tags', 'selection', entityType],
    queryFn: async () => {
      const response = await tagsApi.getAll({
        filters: entityType ? { entityType } : {},
        orderBy: 'name'
      });
      return response;
    }
  });
};

/**
 * Hook to fetch available tags based on search query
 */
export const useAvailableTags = (searchQuery: string, entityType?: EntityType) => {
  return useQuery({
    queryKey: ['tags', 'search', searchQuery, entityType],
    queryFn: async () => {
      const response = await tagsApi.getAll({
        filters: { 
          ...(searchQuery ? { searchQuery } : {}),
          ...(entityType ? { entityType } : {})
        },
        orderBy: 'name'
      });
      return response.data || [];
    },
    enabled: searchQuery.length >= 2 || searchQuery === ''
  });
};

/**
 * Hook to fetch entity tags by ID
 */
export const useEntityTags = (entityId: string, entityType?: EntityType) => {
  return useQuery({
    queryKey: ['entityTags', entityId, entityType],
    queryFn: async () => {
      if (!entityId) return { data: [] };
      
      const response = await getEntityTags(entityId, entityType as EntityType);
      return response;
    },
    enabled: !!entityId
  });
};

/**
 * Hook to filter entities by tag
 */
export const useFilterByTag = (tagId: string | null, entityType?: EntityType) => {
  return useQuery({
    queryKey: ['tagAssignments', tagId, entityType],
    queryFn: async () => {
      if (!tagId) return { data: [] };
      
      const response = await getEntitiesWithTag(tagId, entityType);
      return response;
    },
    enabled: !!tagId
  });
};

/**
 * Hooks for tag assignment mutations (assign/unassign)
 */
export const useTagAssignmentMutations = () => {
  const queryClient = useQueryClient();
  
  // Assign a tag to an entity
  const assignTagMutation = useMutation({
    mutationFn: async ({ 
      tagId, 
      entityId, 
      entityType 
    }: { 
      tagId: string; 
      entityId: string; 
      entityType: EntityType 
    }) => {
      if (!isValidEntityType(entityType)) {
        throw new Error(`Invalid entity type: ${entityType}`);
      }
      
      const response = await assignTag(tagId, entityId, entityType);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entityTags', variables.entityId] });
      queryClient.invalidateQueries({ queryKey: ['entities', variables.entityType] });
      toast.success('Tag assigned successfully');
    },
    onError: (error) => {
      logger.error('Error assigning tag:', error);
      toast.error(`Failed to assign tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Remove a tag assignment
  const removeTagAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await removeTagAssignment(assignmentId);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityTags'] });
      toast.success('Tag removed successfully');
    },
    onError: (error) => {
      logger.error('Error unassigning tag:', error);
      toast.error(`Failed to remove tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  return {
    assignTag: assignTagMutation.mutateAsync,
    removeTagAssignment: removeTagAssignmentMutation.mutateAsync,
    isAssigning: assignTagMutation.isPending,
    isRemoving: removeTagAssignmentMutation.isPending
  };
};

/**
 * Hook for tag CRUD operations
 */
export const useTagCrudMutations = () => {
  const queryClient = useQueryClient();
  
  // Create a new tag
  const createTagMutation = useMutation({
    mutationFn: async (tagData: any) => {
      const response = await tagsApi.create(tagData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (error) => {
      logger.error('Error creating tag:', error);
      throw error;
    }
  });

  // Update a tag
  const updateTagMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await tagsApi.update(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (error) => {
      logger.error('Error updating tag:', error);
      throw error;
    }
  });

  // Delete a tag
  const deleteTagMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await tagsApi.delete(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (error) => {
      logger.error('Error deleting tag:', error);
      throw error;
    }
  });

  return {
    createTag: createTagMutation.mutateAsync,
    updateTag: updateTagMutation.mutateAsync,
    deleteTag: deleteTagMutation.mutateAsync,
    isCreating: createTagMutation.isPending,
    isUpdating: updateTagMutation.isPending,
    isDeleting: deleteTagMutation.isPending
  };
};

// Backward compatibility alias
export { useSelectionTags as useTags };
