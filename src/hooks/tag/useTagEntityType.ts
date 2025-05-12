
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  updateTagEntityType as updateTagEntityTypeUtil,
  invalidateTagCache
} from "@/utils/tags";
import { toast } from "@/components/ui/sonner";

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
      entityType: string;
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
      
      // Clear cache for this entity type
      invalidateTagCache(variables.entityType as "person" | "organization");
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
