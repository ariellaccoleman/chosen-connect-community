
import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  tagsApi, 
  getAllTags, 
  createTag, 
  updateTag,
  deleteTag
} from "@/api/tags";
import { Tag, TagAssignment } from "@/utils/tags/types";
import { EntityType } from "@/types/entityTypes";
import { apiClient } from "@/api/core/apiClient";
import { assignTag, removeTagAssignment } from "@/utils/tags/tagAssignments";

/**
 * Hook to fetch tags for selection lists
 */
export function useSelectionTags(entityType?: EntityType) {
  return useQuery({
    queryKey: ["tags", entityType],
    queryFn: async () => {
      // If entityType is provided, filter tags by type
      if (entityType) {
        const response = await tagsApi.getAll({
          filters: { type: entityType }
        });
        return response;
      }
      
      // Otherwise, get all tags
      return getAllTags();
    }
  });
}

/**
 * Hook to filter entities by a selected tag
 */
export function useFilterByTag(tagId: string | null, entityType?: EntityType) {
  return useQuery({
    queryKey: ["tag-assignments", tagId, entityType],
    queryFn: async () => {
      if (!tagId) return [];
      
      // Fetch tag assignments for the given tag ID and optional entity type
      const { data, error } = await apiClient.query(client => 
        client
          .from("tag_assignments")
          .select("*")
          .eq("tag_id", tagId)
          .then(res => {
            // Filter by entity type if provided
            if (entityType && res.data) {
              return {
                ...res,
                data: res.data.filter(item => item.target_type === entityType)
              };
            }
            return res;
          })
      );
      
      if (error) throw error;
      return data as TagAssignment[];
    },
    enabled: !!tagId // Only run query if tagId is provided
  });
}

/**
 * Hook for CRUD operations on tags
 */
export function useTagCrudMutations() {
  const queryClient = useQueryClient();
  
  const createTagMutation = useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    }
  });
  
  const updateTagMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tag> }) => updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    }
  });
  
  const deleteTagMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    }
  });
  
  return {
    createTag: createTagMutation.mutate,
    updateTag: updateTagMutation.mutate,
    deleteTag: deleteTagMutation.mutate,
    isCreating: createTagMutation.isPending,
    isUpdating: updateTagMutation.isPending,
    isDeleting: deleteTagMutation.isPending,
    error: createTagMutation.error || updateTagMutation.error || deleteTagMutation.error
  };
}

/**
 * Hook to fetch tags for a specific entity
 */
export function useEntityTags(entityId: string, entityType: EntityType) {
  return useQuery({
    queryKey: ["entity", entityId, "tags"],
    queryFn: async () => {
      if (!entityId) return { status: 'success', data: [] };
      
      const { getEntityTags } = await import("@/api/tags/entityTagsApi");
      return getEntityTags(entityId, entityType);
    },
    enabled: !!entityId
  });
}

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
      return assignTag(tagId, entityId, entityType);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["entity", variables.entityId, "tags"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    }
  });
  
  const removeTagMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return removeTagAssignment(assignmentId);
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

/**
 * Deprecated: Use useFilterByTag instead
 * @deprecated Use useFilterByTag instead
 */
export function useFilterTags(tagId: string | null, entityType?: EntityType) {
  console.warn('useFilterTags is deprecated, use useFilterByTag instead');
  return useFilterByTag(tagId, entityType);
}

/**
 * Deprecated: Use useSelectionTags instead
 * @deprecated Use useSelectionTags instead
 */
export function useTags(entityType?: EntityType) {
  console.warn('useTags is deprecated, use useSelectionTags instead');
  return useSelectionTags(entityType);
}
