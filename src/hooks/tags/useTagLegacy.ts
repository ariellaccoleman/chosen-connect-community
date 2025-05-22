
/**
 * Legacy tag hook implementations
 * @deprecated These hooks are maintained for backward compatibility
 */
import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tagApi, tagAssignmentApi } from "@/api/tags";
import { Tag, TagAssignment } from "@/utils/tags/types";
import { EntityType, isValidEntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";

/**
 * Deprecated: Use useFilterByTag instead
 * @deprecated Use useFilterByTag instead
 */
export function useFilterTags(tagId: string | null, entityType?: EntityType) {
  console.warn('useFilterTags is deprecated, use useFilterByTag instead');
  return useFilterByTag(tagId, entityType);
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
        // Use the tagAssignmentApi from factory
        return await tagAssignmentApi.getForEntity(tagId, entityType);
      } catch (e) {
        logger.error(`useFilterByTag: Exception fetching tag assignments`, e);
        return [];
      }
    },
    enabled: !!tagId // Only run query if tagId is provided
  });
}

/**
 * Deprecated: Use useSelectionTags instead
 * @deprecated Use useSelectionTags instead
 */
export function useTags(entityType?: EntityType) {
  console.warn('useTags is deprecated, use useSelectionTags instead');
  return useSelectionTags(entityType);
}

/**
 * Hook to fetch tags for a specific entity
 * @deprecated Use useEntityTags instead
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
        // Use tagAssignmentApi
        const assignments = await tagAssignmentApi.getForEntity(entityId, entityType);
        return { 
          status: 'success', 
          data: assignments
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
 * Hook to fetch tags for selection lists
 * @deprecated Use useSelectionTags from useTagQuery instead
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
        
        // Use the tagApi from factory
        const tags = await tagApi.getAll();
        
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
