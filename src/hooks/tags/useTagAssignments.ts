
/**
 * Tag Assignment Hooks
 * Provides hooks for managing tag assignments
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EntityType, isValidEntityType } from '@/types/entityTypes';
import { createTagAssignmentService } from '@/api/tags/services';
import { logger } from '@/utils/logger';

// Create service instance
const tagAssignmentService = createTagAssignmentService();

/**
 * Hook for tag assignment operations
 */
export function useTagAssignmentMutations() {
  const queryClient = useQueryClient();
  
  const assignTagMutation = useMutation({
    mutationFn: async ({ 
      tagId, 
      entityId, 
      entityType 
    }: { 
      tagId: string, 
      entityId: string, 
      entityType: EntityType 
    }) => {
      // Validate entity type
      if (!isValidEntityType(entityType)) {
        throw new Error(`Invalid entity type: ${entityType}`);
      }
      
      return tagAssignmentService.assignTag(tagId, entityId, entityType);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["entity", variables.entityId, "tags"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    }
  });
  
  const removeTagMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return tagAssignmentService.removeTagAssignment(assignmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    }
  });
  
  return {
    assignTag: assignTagMutation.mutate,
    removeTagAssignment: removeTagMutation.mutate,
    isAssigning: assignTagMutation.isPending,
    isRemoving: removeTagMutation.isPending,
    error: assignTagMutation.error || removeTagMutation.error
  };
}
