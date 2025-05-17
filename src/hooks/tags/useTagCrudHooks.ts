
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../useAuth";
import { 
  Tag, 
  createTag, 
  updateTag, 
  deleteTag,
  findOrCreateTag as findOrCreateTagUtil,
  updateTagEntityType as updateTagEntityTypeUtil,
  invalidateTagCache 
} from "@/utils/tags";
import { toast } from "@/components/ui/sonner";
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

/**
 * Hook for finding or creating tags
 */
export const useTagFindOrCreate = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Find or Create tag mutation
  const findOrCreateTagMutation = useMutation({
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
      
      // Call the findOrCreateTag function with the correct parameters
      const tag = await findOrCreateTagUtil({
        name,
        description,
        type,
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
      console.error("Error in findOrCreateTagMutation:", error);
      toast.error(`Failed to create tag: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });

  return {
    findOrCreateTag: async (params: Parameters<typeof findOrCreateTagMutation.mutateAsync>[0]): Promise<Tag | null> => {
      try {
        const result = await findOrCreateTagMutation.mutateAsync(params);
        return result;
      } catch (error) {
        console.error("Error in findOrCreateTag:", error);
        return null;
      }
    },
    isCreating: findOrCreateTagMutation.isPending
  };
};

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

/**
 * Combined hook for tag CRUD operations
 * Provides mutations for finding/creating, updating, and deleting tags
 */
export const useTagCrudMutations = () => {
  const { findOrCreateTag, isCreating: isFindOrCreating } = useTagFindOrCreate();
  const { updateTagEntityType } = useTagEntityType();
  const { 
    createTag, 
    updateTag, 
    deleteTag,
    isCreating: isBasicCreating,
    isUpdating,
    isDeleting
  } = useTagBasicCrud();

  return {
    findOrCreateTag,
    updateTagEntityType,
    createTag,
    updateTag,
    deleteTag,
    isCreating: isFindOrCreating || isBasicCreating,
    isUpdating,
    isDeleting
  };
};
