
/**
 * Tag Assignment Hooks
 * Provides hooks for tag assignment operations
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TagAssignment } from '@/utils/tags/types';
import { EntityType, isValidEntityType } from '@/types/entityTypes';
import { extendedTagAssignmentApi } from '@/api/tags/factory/tagApiFactory';
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
        const response = await extendedTagAssignmentApi.getForEntity(entityId, entityType);
        if (response.error) {
          logger.error(`Error fetching tag assignments for entity ${entityId}:`, response.error);
          throw response.error;
        }
        return response.data || [];
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
      return extendedTagAssignmentApi.create(tagId, entityId, entityType);
    },
    onSuccess: (response, variables) => {
      if (response.error) {
        throw response.error;
      }
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
      return extendedTagAssignmentApi.delete(assignmentId);
    },
    onSuccess: (response) => {
      if (response.error) {
        throw response.error;
      }
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
