
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  assignTag, 
  removeTagAssignment,
  invalidateTagCache 
} from "@/utils/tags";
import { EntityType, isValidEntityType } from "@/types/entityTypes";

/**
 * Hook for tag assignment mutations
 * Provides mutations for assigning tags to entities and removing tag assignments
 */
export const useTagAssignmentMutations = () => {
  const queryClient = useQueryClient();

  // Assign tag mutation
  const assignTagMutation = useMutation({
    mutationFn: async ({
      tagId,
      entityId,
      entityType
    }: {
      tagId: string;
      entityId: string;
      entityType: EntityType | string; 
    }) => {
      // Validate entity type
      if (!isValidEntityType(entityType)) {
        throw new Error(`Invalid entity type: ${entityType}`);
      }
      
      return assignTag(tagId, entityId, entityType);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["entity-tags", variables.entityId, variables.entityType] 
      });
      // Also invalidate tags query as entity types might have changed
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      // Clear the tag cache for this entity type
      invalidateTagCache(variables.entityType);
    },
    onError: (error) => {
      console.error("Error in assignTagMutation:", error);
    }
  });

  // Remove tag assignment mutation
  const removeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return removeTagAssignment(assignmentId);
    },
    onSuccess: () => {
      // Since we don't know which entity this was for, we invalidate all entity-tags queries
      queryClient.invalidateQueries({ queryKey: ["entity-tags"] });
      // Also invalidate tags in case entity types changed
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      // Clear both person and organization tag caches to be safe
      Object.values(EntityType).forEach(type => {
        invalidateTagCache(type);
      });
    },
    onError: (error) => {
      console.error("Error in removeAssignmentMutation:", error);
    }
  });

  return {
    assignTag: assignTagMutation.mutateAsync,
    removeTagAssignment: removeAssignmentMutation.mutateAsync,
    isAssigning: assignTagMutation.isPending,
    isRemoving: removeAssignmentMutation.isPending
  };
};
