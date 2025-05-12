
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../useAuth";
import { 
  Tag, 
  createTag, 
  updateTag, 
  deleteTag,
  invalidateTagCache, 
  findOrCreateTag as findOrCreateTagUtil,
  updateTagEntityType as updateTagEntityTypeUtil
} from "@/utils/tags";
import { toast } from "@/components/ui/sonner";

/**
 * Hook for tag CRUD operations
 * Provides mutations for finding/creating, updating, and deleting tags
 */
export const useTagCrudMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Find or Create tag mutation
  const findOrCreateTagMutation = useMutation({
    mutationFn: async ({ 
      name, 
      description = null, 
      type, 
      isPublic = false
    }: {
      name: string;
      description?: string | null;
      type: string;
      isPublic?: boolean;
    }) => {
      if (!user?.id) throw new Error("User must be authenticated");
      
      // Call the findOrCreateTag function with the correct parameters
      const tag = await findOrCreateTagUtil({
        name,
        description,
        type,
        is_public: isPublic,
        created_by: user.id
      });
      
      if (!tag) {
        throw new Error("Failed to find or create tag");
      }
      
      return tag;
    },
    onSuccess: (data, variables) => {
      console.log("Tag found or created successfully:", data);
      
      // Invalidate all tag queries since new tag could affect any of them
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      
      // Also clear any cached tag data from the server
      invalidateTagCache(variables.type === "person" ? "person" : "organization" as "person" | "organization");
    },
    onError: (error) => {
      console.error("Error in findOrCreateTagMutation:", error);
      toast.error(`Failed to create tag: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });

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

  // Create tag mutation (kept for backward compatibility)
  const createTagMutation = useMutation({
    mutationFn: async ({ 
      name, 
      description = null, 
      type, 
      isPublic = false
    }: {
      name: string;
      description?: string | null;
      type: string;
      isPublic?: boolean;
    }) => {
      if (!user?.id) throw new Error("User must be authenticated");
      
      // Call the createTag function with the correct parameters
      const tag = await createTag({
        name,
        description,
        type,
        is_public: isPublic,
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
      
      // Also clear any cached tag data from the server
      invalidateTagCache(variables.type === "person" ? "person" : "organization" as "person" | "organization");
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
    findOrCreateTag: (params: Parameters<typeof findOrCreateTagMutation.mutate>[0], options?: {
      onSuccess?: (data: Tag) => void;
      onError?: (error: any) => void;
    }) => {
      return findOrCreateTagMutation.mutate(params, {
        onSuccess: (data) => options?.onSuccess?.(data),
        onError: (error) => options?.onError?.(error)
      });
    },
    updateTagEntityType: (params: Parameters<typeof updateTagEntityTypeMutation.mutate>[0], options?: {
      onSuccess?: (data: boolean) => void;
      onError?: (error: any) => void;
    }) => {
      return updateTagEntityTypeMutation.mutate(params, {
        onSuccess: (data) => options?.onSuccess?.(data),
        onError: (error) => options?.onError?.(error)
      });
    },
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
    isCreating: createTagMutation.isPending || findOrCreateTagMutation.isPending,
    isUpdating: updateTagMutation.isPending,
    isDeleting: deleteTagMutation.isPending
  };
};
