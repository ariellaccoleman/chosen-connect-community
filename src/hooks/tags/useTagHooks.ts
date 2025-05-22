
import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getAllTags, 
  createTag, 
  updateTag,
  deleteTag
} from "@/api/tags";
import { Tag, TagAssignment } from "@/utils/tags/types";
import { EntityType, isValidEntityType } from "@/types/entityTypes";
import { apiClient } from "@/api/core/apiClient";
import { supabase } from "@/integrations/supabase/client"; // Added this import
import { assignTag, removeTagAssignment } from "@/utils/tags/tagAssignments";
import { fetchSelectionTags, fetchFilterTags } from "@/utils/tags/tagOperations";
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
        
        // Use the updated fetchSelectionTags function that uses the new views
        const tags = await fetchSelectionTags({
          targetType: entityType,
          skipCache: false
        });
        
        logger.debug(`useSelectionTags: Found ${tags.length} tags for entity type ${entityType || 'all'}`);
        
        return {
          status: 'success',
          data: tags
        };
      } catch (error) {
        logger.error("Error in useSelectionTags:", error);
        throw error;
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
        // Use the entity_tag_assignments_view for better performance
        const { data, error } = await apiClient.query(client => 
          client
            .from("entity_tag_assignments_view")
            .select("*")
            .eq("tag_id", tagId)
            .then(res => {
              // Filter by entity type if provided
              if (entityType && res.data) {
                logger.debug(`useFilterByTag: Filtering assignments by entity type ${entityType}`);
                return {
                  ...res,
                  data: res.data.filter(item => item.target_type === entityType)
                };
              }
              return res;
            })
        );
        
        if (error) {
          logger.error(`useFilterByTag: Error fetching tag assignments for tagId ${tagId}`, error);
          throw error;
        }
        
        logger.debug(`useFilterByTag: Found ${data?.length || 0} assignments for tagId ${tagId}${entityType ? ` and entityType ${entityType}` : ''}`);
        
        if (tagId === "2de8fd5d-3311-4e38-94a3-596ee596524b" && entityType === EntityType.PERSON) {
          logger.debug("Target tag assignments:", data);
          
          // Check if the target profile is in the results
          const targetProfileId = "95ad82bb-4109-4f88-8155-02231dda3b85";
          const hasTargetProfile = data?.some(ta => ta.target_id === targetProfileId);
          logger.debug(`Target profile ${targetProfileId} in tag assignments: ${hasTargetProfile}`);
          
          // Also check directly with Supabase
          const { data: directData, error: directError } = await supabase
            .from("tag_assignments")
            .select("*")
            .eq("tag_id", tagId)
            .eq("target_type", "person")
            .eq("target_id", targetProfileId);
            
          if (directError) {
            logger.error("Direct query error:", directError);
          } else {
            logger.debug(`Direct query for target assignment: ${directData?.length || 0} results`, directData);
          }
        }
        
        return data as TagAssignment[];
      } catch (e) {
        logger.error(`useFilterByTag: Exception fetching tag assignments`, e);
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
      
      if (!isValidEntityType(entityType)) {
        logger.warn(`Invalid entity type passed to useEntityTags: ${entityType}`);
        return { status: 'success', data: [] };
      }
      
      // Use the entity_tag_assignments_view for more efficient queries
      return apiClient.query(async (client) => {
        const { data, error } = await client
          .from("entity_tag_assignments_view")
          .select("*")
          .eq("target_id", entityId)
          .eq("target_type", entityType);
        
        if (error) throw error;
        
        return { 
          status: 'success', 
          data: data || [] 
        };
      });
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
