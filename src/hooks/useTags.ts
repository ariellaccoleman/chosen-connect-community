
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { 
  Tag, 
  TagAssignment, 
  fetchFilterTags,
  fetchSelectionTags, 
  fetchEntityTags, 
  createTag, 
  updateTag, 
  deleteTag, 
  assignTag, 
  removeTagAssignment, 
  getTagEntityTypes,
  TAG_TYPES 
} from "@/utils/tags";

// Common options for tag queries
interface TagQueryOptions {
  type?: string;
  isPublic?: boolean;
  createdBy?: string;
  searchQuery?: string;
  targetType?: "person" | "organization";
  enabled?: boolean;
}

// Hook for fetching tags for filtering lists (e.g. directory pages)
export const useFilterTags = (options: TagQueryOptions = {}) => {
  return useQuery({
    queryKey: ["tags", "filter", options],
    queryFn: () => fetchFilterTags(options),
    enabled: options.enabled !== false,
    retry: 1,
    meta: {
      onError: (error: any) => {
        console.error("Error in useFilterTags query:", error);
      }
    }
  });
};

// Hook for fetching tags for selection components (e.g. typeaheads)
export const useSelectionTags = (options: TagQueryOptions = {}) => {
  return useQuery({
    queryKey: ["tags", "selection", options],
    queryFn: () => fetchSelectionTags(options),
    enabled: options.enabled !== false,
    retry: 1,
    meta: {
      onError: (error: any) => {
        console.error("Error in useSelectionTags query:", error);
      }
    }
  });
};

// Legacy hook that maintains backward compatibility
// Uses selection tags by default as that's closest to original behavior
export const useTags = (options: TagQueryOptions = {}) => {
  return useSelectionTags(options);
};

// Hook for fetching tags assigned to a specific entity
export const useEntityTags = (
  entityId?: string,
  entityType?: "person" | "organization",
  options: { enabled?: boolean } = {}
) => {
  return useQuery({
    queryKey: ["entity-tags", entityId, entityType],
    queryFn: () => 
      entityId && entityType ? fetchEntityTags(entityId, entityType) : [],
    enabled: !!entityId && !!entityType && options.enabled !== false
  });
};

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
      
      return createTag({
        name,
        description,
        type,
        is_public: isPublic,
        created_by: user.id
      });
    },
    onSuccess: () => {
      // Invalidate all tag queries since new tag could affect any of them
      queryClient.invalidateQueries({ queryKey: ["tags"] });
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
    }
  });

  return {
    createTag: createTagMutation.mutate,
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
