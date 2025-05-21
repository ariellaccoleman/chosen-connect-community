
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi, assignmentApi, entityTagsApi } from '@/api/tags';
import { EntityType, isValidEntityType } from '@/types/entityTypes';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

/**
 * Hook to fetch tags for selection dropdowns
 */
export const useSelectionTags = (entityType?: EntityType) => {
  return useQuery({
    queryKey: ['tags', 'selection', entityType],
    queryFn: async () => {
      const response = await tagsApi.getTags(entityType);
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
      const response = await tagsApi.searchTags(searchQuery, entityType);
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
      if (!entityId) return [];
      
      const response = await entityTagsApi.getTagsByEntityId(entityId, entityType as EntityType);
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
      if (!tagId) return [];
      
      const response = await assignmentApi.getAssignmentsByTagId(tagId, entityType);
      return response.data || [];
    },
    enabled: !!tagId
  });
};

/**
 * Hook to assign a tag to an entity
 */
export const useAssignTag = (entityType: EntityType) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ entityId, tagId }: { entityId: string, tagId: string }) => {
      if (!isValidEntityType(entityType)) {
        throw new Error(`Invalid entity type: ${entityType}`);
      }
      
      const response = await assignmentApi.assignTag({
        tag_id: tagId,
        target_id: entityId,
        target_type: entityType
      });
      
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entityTags', variables.entityId] });
      queryClient.invalidateQueries({ queryKey: ['entities', entityType] });
      toast.success('Tag assigned successfully');
    },
    onError: (error) => {
      logger.error('Error assigning tag:', error);
      toast.error(`Failed to assign tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
};

/**
 * Hook to unassign a tag from an entity
 */
export const useUnassignTag = (entityType: EntityType) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await assignmentApi.unassignTag(assignmentId);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entityTags'] });
      queryClient.invalidateQueries({ queryKey: ['entities', entityType] });
      toast.success('Tag removed successfully');
    },
    onError: (error) => {
      logger.error('Error unassigning tag:', error);
      toast.error(`Failed to remove tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
};

// Backward compatibility alias
export { useSelectionTags as useTags };
