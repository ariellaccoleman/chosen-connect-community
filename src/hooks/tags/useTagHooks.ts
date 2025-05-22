
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tag, TagAssignment } from "@/utils/tags/types";
import { EntityType } from "@/types/entityTypes";
import { createTag, updateTag, deleteTag } from "@/api/tags/tagCrudApi";
import { assignTag, removeTagAssignment, getEntityTagAssignments } from "@/api/tags/assignmentApi";
import { getTags, getTagsByEntityType } from "@/api/tags/getTagsApi";
import { getAllFilteredEntityTags } from "@/api/tags/tagApiFactory";

/**
 * Hook for CRUD operations on tags
 */
export function useTagCrudMutations() {
  const queryClient = useQueryClient();
  
  const createTagMutation = useMutation({
    mutationFn: (data: Partial<Tag>) => createTag(data),
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
 * Hook for selecting tags with optional entity type filtering
 */
export function useSelectionTags(entityType?: EntityType) {
  return useQuery({
    queryKey: ["tags", "selection", entityType],
    queryFn: async () => {
      if (entityType) {
        return getTagsByEntityType(entityType);
      } else {
        return getTags();
      }
    }
  });
}

/**
 * Hook for filtering entities by tag
 */
export function useFilterByTag(tagId: string | null, entityType?: EntityType) {
  return useQuery({
    queryKey: ["tagAssignments", "filter", tagId, entityType],
    queryFn: async () => {
      if (!tagId) return [];
      
      const response = await getEntityTagAssignments(tagId, entityType);
      return response.data || [];
    },
    enabled: !!tagId
  });
}

/**
 * Hook for getting tags assigned to a specific entity
 */
export function useEntityTags(entityId: string, entityType: EntityType) {
  return useQuery({
    queryKey: ["entity", entityId, "tags"],
    queryFn: async () => {
      if (!entityId) return { data: [] };
      return getEntityTagAssignments(entityId, entityType);
    },
    enabled: !!entityId && !!entityType
  });
}

/**
 * Hook for tag assignment mutations
 */
export function useTagAssignmentMutations() {
  const queryClient = useQueryClient();
  
  const assignTagMutation = useMutation({
    mutationFn: ({ 
      tagId, 
      entityId, 
      entityType 
    }: { 
      tagId: string; 
      entityId: string; 
      entityType: EntityType 
    }) => assignTag(tagId, entityId, entityType),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["entity", variables.entityId, "tags"] });
      queryClient.invalidateQueries({ queryKey: ["tagAssignments"] });
    }
  });
  
  const removeTagMutation = useMutation({
    mutationFn: (assignmentId: string) => removeTagAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity"] });
      queryClient.invalidateQueries({ queryKey: ["tagAssignments"] });
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
