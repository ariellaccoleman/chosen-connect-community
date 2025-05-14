
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  assignTag, 
  removeTagAssignment,
  invalidateTagCache 
} from "@/utils/tags";
import { EntityType, isValidEntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";

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
      entityType: EntityType; 
    }) => {
      // Validate entity type
      if (!isValidEntityType(entityType)) {
        throw new Error(`Invalid entity type: ${entityType}`);
      }
      
      logger.info("Executing assignTag mutation:", { tagId, entityId, entityType });
      console.log("Executing assignTag mutation:", { tagId, entityId, entityType });
      return assignTag(tagId, entityId, entityType);
    },
    onSuccess: (_, variables) => {
      logger.info("Tag assignment successful, invalidating queries", variables);
      console.log("Tag assignment successful, invalidating queries");
      
      // Invalidate entity-tags queries
      queryClient.invalidateQueries({ 
        queryKey: ["entity-tags", variables.entityId, variables.entityType] 
      });
      
      // Invalidate specific entity queries if this is an event
      if (variables.entityType === EntityType.EVENT) {
        queryClient.invalidateQueries({ 
          queryKey: ["event", variables.entityId] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ["events"] 
        });
      }
      
      // Also invalidate tags query as entity types might have changed
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["selection-tags"] });
      
      // Clear the tag cache for this entity type
      invalidateTagCache(variables.entityType);
    },
    onError: (error) => {
      logger.error("Error in assignTagMutation:", error);
      console.error("Error in assignTagMutation:", error);
    }
  });

  // Remove tag assignment mutation
  const removeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return removeTagAssignment(assignmentId);
    },
    onSuccess: () => {
      logger.info("Tag assignment removed successfully");
      
      // Since we don't know which entity this was for, we invalidate all entity-tags queries
      queryClient.invalidateQueries({ queryKey: ["entity-tags"] });
      
      // Invalidate event queries since they include tags
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
      
      // Also invalidate tags in case entity types changed
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["selection-tags"] });
      
      // Clear all entity type caches to be safe
      Object.values(EntityType).forEach(type => {
        invalidateTagCache(type);
      });
    },
    onError: (error) => {
      logger.error("Error in removeAssignmentMutation:", error);
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
