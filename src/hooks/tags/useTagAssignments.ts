
/**
 * Tag Assignment Hooks
 * Provides hooks for tag assignment operations
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TagAssignment } from '@/utils/tags/types';
import { EntityType, isValidEntityType } from '@/types/entityTypes';
import { tagAssignmentApi } from '@/api/tags';
import { logger } from '@/utils/logger';

/**
 * Hook to fetch tag assignments for an entity
 */
export function useEntityTagAssignments(entityId: string, entityType: EntityType) {
  return useQuery({
    queryKey: ["entity", entityId, "tag-assignments"],
    queryFn: async () => {
      if (!entityId) return [];
      
      if (!isValidEntityType(entityType)) {
        logger.warn(`Invalid entity type passed to useEntityTagAssignments: ${entityType}`);
        return [];
      }
      
      try {
        return await tagAssignmentApi.getForEntity(entityId, entityType);
      } catch (error) {
        logger.error(`Error fetching tag assignments for entity ${entityId}:`, error);
        throw error;
      }
    },
    enabled: !!entityId && isValidEntityType(entityType)
  });
}

/**
 * Hook for assigning a tag to an entity
 */
export function useAssignTag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      tagId, 
      entityId, 
      entityType 
    }: { 
      tagId: string, 
      entityId: string, 
      entityType: EntityType 
    }) => {
      if (!isValidEntityType(entityType)) {
        throw new Error(`Invalid entity type: ${entityType}`);
      }
      
      logger.debug(`Assigning tag ${tagId} to entity ${entityId} of type ${entityType}`);
      return tagAssignmentApi.create(tagId, entityId, entityType);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["entity", variables.entityId, "tag-assignments"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["entity", variables.entityId, "tags"] 
      });
    }
  });
}

/**
 * Hook for removing a tag assignment
 */
export function useRemoveTagAssignment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (assignmentId: string) => {
      logger.debug(`Removing tag assignment ${assignmentId}`);
      return tagAssignmentApi.delete(assignmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    }
  });
}

/**
 * Combined hook for tag assignment operations
 */
export function useTagAssignmentMutations() {
  const assignTag = useAssignTag();
  const removeTagAssignment = useRemoveTagAssignment();
  
  return {
    assignTag: assignTag.mutate,
    removeTagAssignment: removeTagAssignment.mutate,
    isAssigning: assignTag.isPending,
    isRemoving: removeTagAssignment.isPending,
    error: assignTag.error || removeTagAssignment.error
  };
}
