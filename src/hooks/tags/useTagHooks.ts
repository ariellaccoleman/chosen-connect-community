
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tag, TagAssignment } from "@/utils/tags/types";
import { EntityType } from "@/types/entityTypes";
import { createTag, updateTag, deleteTag } from "@/api/tags/tagCrudApi";
import { assignTag, removeTagAssignment } from "@/api/tags/assignmentApi";
import { getTags } from "@/api/tags";
import { getAllFilteredEntityTags, getEntityTagAssignments } from "@/api/tags";
import { logger } from "@/utils/logger";

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
      try {
        // Use getTags for all tag selection needs
        const response = await getTags({ targetType: entityType });
        logger.debug(`Retrieved ${response?.data?.length || 0} tags for entity type: ${entityType || 'all'}`);
        return response;
      } catch (error) {
        logger.error(`Error fetching selection tags for entity type ${entityType || 'all'}:`, error);
        throw error;
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
      if (!tagId) return { data: [] };
      
      logger.debug(`Fetching tag assignments for tag: ${tagId}, entity type: ${entityType || 'all'}`);
      
      try {
        const response = await getEntityTagAssignments();
        
        if (response.status === "success" && response.data) {
          // Filter the results client-side
          const filteredData = response.data.filter(item => 
            item.tag_id === tagId && (!entityType || item.target_type === entityType)
          );
          
          logger.debug(`Found ${filteredData.length} tag assignments for tag ${tagId}`);
          return { data: filteredData };
        }
        
        logger.warn(`No tag assignments found for tag ${tagId} or error in response`);
        return { data: [] };
      } catch (error) {
        logger.error(`Error fetching tag assignments for tag ${tagId}:`, error);
        return { data: [] };
      }
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
      
      try {
        const response = await getEntityTagAssignments();
        // Filter by entity ID and type client-side
        const filteredData = response.data ? response.data.filter(item => 
          item.target_id === entityId && item.target_type === entityType
        ) : [];
        
        return { data: filteredData };
      } catch (error) {
        logger.error(`Error fetching tags for entity ${entityId}:`, error);
        return { data: [] };
      }
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
