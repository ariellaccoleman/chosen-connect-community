
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../useAuth";
import { 
  Tag, 
  createTag, 
  updateTag, 
  deleteTag,
  invalidateTagCache 
} from "@/utils/tags";
import { EntityType } from "@/types/entityTypes";

/**
 * Hook for basic tag CRUD operations
 */
export const useTagBasicCrud = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Create tag mutation (kept for backward compatibility)
  const createTagMutation = useMutation({
    mutationFn: async ({ 
      name, 
      description = null, 
      type
    }: {
      name: string;
      description?: string | null;
      type: string;
    }) => {
      if (!user?.id) throw new Error("User must be authenticated");
      
      // Call the createTag function with the correct parameters
      const tag = await createTag({
        name,
        description,
        type,
        created_by: user.id
      });
      
      if (!tag) {
        throw new Error("Failed to create tag");
      }
      
      return tag;
    },
    onSuccess: (data, variables) => {
      console.log("Tag created successfully:", data);
      
      // Invalidate all tag queries since new tag could affect any of them
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      
      // Determine EntityType from the type string
      const entityType = 
        variables.type === "person" ? EntityType.PERSON : 
        variables.type === "organization" ? EntityType.ORGANIZATION :
        variables.type === "event" ? EntityType.EVENT : undefined;
      
      // Also clear any cached tag data from the server
      if (entityType) {
        invalidateTagCache(entityType);
      } else {
        invalidateTagCache();
      }
    },
    onError: (error) => {
      console.error("Error in createTagMutation:", error);
    }
  });

  // Update tag mutation
  const updateTagMutation = useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string;
      updates: Partial<Tag>;
    }) => {
      return updateTag(id, updates);
    },
    onSuccess: () => {
      // Invalidate all tag queries
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      // Also clear any cached tag data from the server
      invalidateTagCache();
    }
  });

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      return deleteTag(tagId);
    },
    onSuccess: () => {
      // Invalidate all tag queries
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      // Also invalidate entity-tags queries as they might be affected
      queryClient.invalidateQueries({ queryKey: ["entity-tags"] });
      // Also clear any cached tag data from the server
      invalidateTagCache();
    }
  });

  return {
    createTag: (params: Parameters<typeof createTagMutation.mutate>[0], options?: {
      onSuccess?: (data: Tag | null) => void;
      onError?: (error: any) => void;
    }) => {
      return createTagMutation.mutate(params, {
        onSuccess: (data) => options?.onSuccess?.(data),
        onError: (error) => options?.onError?.(error)
      });
    },
    updateTag: updateTagMutation.mutate,
    deleteTag: deleteTagMutation.mutate,
    isCreating: createTagMutation.isPending,
    isUpdating: updateTagMutation.isPending,
    isDeleting: deleteTagMutation.isPending
  };
};
