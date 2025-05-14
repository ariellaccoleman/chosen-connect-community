
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  updateTagEntityType as updateTagEntityTypeUtil,
  invalidateTagCache
} from "@/utils/tags";
import { toast } from "@/components/ui/sonner";
import { EntityType } from "@/types/entityTypes";

/**
 * Hook for tag entity type operations
 */
export const useTagEntityType = () => {
  const queryClient = useQueryClient();

  // Update tag entity type mutation
  const updateTagEntityTypeMutation = useMutation({
    mutationFn: async ({
      tagId,
      entityType
    }: {
      tagId: string;
      entityType: string | EntityType;
    }) => {
      const success = await updateTagEntityTypeUtil(tagId, entityType);
      
      if (!success) {
        throw new Error("Failed to update tag entity type");
      }
      
      return success;
    },
    onSuccess: (_, variables) => {
      console.log(`Tag entity type updated: ${variables.tagId} -> ${variables.entityType}`);
      
      // Invalidate tag queries that might be affected
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      
      // Convert string to EntityType if needed
      let entityTypeEnum: EntityType | undefined;
      if (typeof variables.entityType === 'string') {
        entityTypeEnum = 
          variables.entityType === "person" ? EntityType.PERSON : 
          variables.entityType === "organization" ? EntityType.ORGANIZATION :
          variables.entityType === "event" ? EntityType.EVENT : undefined;
      } else {
        entityTypeEnum = variables.entityType;
      }
      
      // Clear cache for this entity type
      if (entityTypeEnum) {
        invalidateTagCache(entityTypeEnum);
      }
    },
    onError: (error) => {
      console.error("Error in updateTagEntityTypeMutation:", error);
      toast.error(`Failed to update tag entity type: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });

  return {
    updateTagEntityType: (params: Parameters<typeof updateTagEntityTypeMutation.mutate>[0], options?: {
      onSuccess?: (data: boolean) => void;
      onError?: (error: any) => void;
    }) => {
      return updateTagEntityTypeMutation.mutate(params, {
        onSuccess: (data) => options?.onSuccess?.(data),
        onError: (error) => options?.onError?.(error)
      });
    },
    isUpdatingEntityType: updateTagEntityTypeMutation.isPending
  };
};
