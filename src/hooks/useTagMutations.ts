
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { 
  Tag, 
  createTag, 
  updateTag, 
  deleteTag, 
  assignTag, 
  removeTagAssignment,
  invalidateTagCache
} from "@/utils/tags";

// Hook for tag mutations (create, update, delete)
export const useTagMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Create tag mutation
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
      
      const tag = await createTag({
        name,
        description,
        type,
        is_public: isPublic,
        created_by: user.id
      });
      
      return tag;
    },
    onSuccess: () => {
      // Invalidate all tag queries since new tag could affect any of them
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      // Also clear any cached tag data from the server
      invalidateTagCache();
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

// Hook for tag assignment mutations
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
      entityType: "person" | "organization"; 
    }) => {
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
      invalidateTagCache("person");
      invalidateTagCache("organization");
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
