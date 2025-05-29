
import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  tagApi,
  tagAssignmentApi
} from "@/api/tags/factory/tagApiFactory";
import { Tag, TagAssignment } from "@/utils/tags/types";
import { EntityType, isValidEntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";

/**
 * Hook to fetch tags for selection lists
 */
export function useSelectionTags(entityType?: EntityType) {
  return useQuery({
    queryKey: ["tags", "selection", entityType],
    queryFn: async () => {
      try {
        if (entityType && !isValidEntityType(entityType)) {
          logger.warn(`Invalid entity type passed to useSelectionTags: ${entityType}`);
          return {
            status: 'success',
            data: []
          };
        }
        
        // Use the simplified tagApi
        const response = await tagApi.getAll();
        if (response.error) {
          logger.error("Error in useSelectionTags:", response.error);
          return {
            status: 'error',
            data: [],
            error: response.error
          };
        }
        
        const tags = response.data || [];
        logger.debug(`useSelectionTags: Found ${tags.length} tags for entity type ${entityType || 'all'}`);
        
        return {
          status: 'success',
          data: tags
        };
      } catch (error) {
        logger.error("Error in useSelectionTags:", error);
        return {
          status: 'error',
          data: [],
          error
        };
      }
    },
    staleTime: 30000 // Cache for 30 seconds
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
      
      if (entityType && !isValidEntityType(entityType)) {
        logger.warn(`Invalid entity type passed to useFilterByTag: ${entityType}`);
        return [];
      }
      
      try {
        // Log for debugging filters
        logger.debug(`useFilterByTag: Fetching entities with tagId=${tagId}, entityType=${entityType || 'all'}`);
        
        // Use the simplified tagAssignmentApi
        const response = await tagAssignmentApi.getEntitiesByTagId(tagId, entityType);
        if (response.error) {
          logger.error(`useFilterByTag: Error fetching tag assignments for tag ${tagId}:`, response.error);
          return [];
        }
        
        const assignments = response.data || [];
        
        // Log results for debugging
        logger.debug(`useFilterByTag: Found ${assignments.length} tag assignments for tag ${tagId}`);
        logger.debug(`Assignment target IDs: ${assignments.map(a => a.target_id).join(', ')}`);
        
        return assignments;
      } catch (e) {
        logger.error(`useFilterByTag: Exception fetching tag assignments for tag ${tagId}:`, e);
        return [];
      }
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
    mutationFn: async (data: Partial<Tag>) => {
      const response = await tagApi.create(data);
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    }
  });
  
  const updateTagMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Tag> }) => {
      const response = await tagApi.update(id, data);
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    }
  });
  
  const deleteTagMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await tagApi.delete(id);
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
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
      
      if (!isValidEntityType(entityType)) {
        logger.warn(`Invalid entity type passed to useEntityTags: ${entityType}`);
        return { status: 'success', data: [] };
      }
      
      try {
        // Use simplified tagAssignmentApi
        const response = await tagAssignmentApi.getAll({ 
          filters: { 
            target_id: entityId, 
            target_type: entityType 
          } 
        });
        if (response.error) {
          logger.error(`Error fetching tags for entity ${entityId}:`, response.error);
          throw response.error;
        }
        
        return { 
          status: 'success', 
          data: response.data || []
        };
      } catch (error) {
        logger.error(`Error fetching tags for entity ${entityId}:`, error);
        throw error;
      }
    },
    enabled: !!entityId && isValidEntityType(entityType)
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
      // Validate entity type
      if (!isValidEntityType(entityType)) {
        throw new Error(`Invalid entity type: ${entityType}`);
      }
      
      // Create assignment using business operation method
      const response = await tagAssignmentApi.createAssignment(tagId, entityId, entityType);
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["entity", variables.entityId, "tags"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    }
  });
  
  const removeTagMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      // Delete assignment using simplified API
      const response = await tagAssignmentApi.delete(assignmentId);
      if (response.error) {
        throw response.error;
      }
      return response.data;
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
