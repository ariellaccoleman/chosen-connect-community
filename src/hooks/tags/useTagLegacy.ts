
import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { extendedTagApi } from "@/api/tags/factory/tagApiFactory";
import { Tag } from "@/utils/tags/types";
import { EntityType, isValidEntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";

/**
 * Legacy hook to fetch tags for selection lists
 * @deprecated Use useSelectionTags from useTagHooks instead
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
        
        // Use the extendedTagApi
        const tags = await extendedTagApi.getAll();
        
        logger.debug(`useSelectionTags: Found ${tags.length} tags for entity type ${entityType || 'all'}`);
        
        return {
          status: 'success',
          data: tags || []
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
 * Deprecated: Use useFilterByTag instead
 * @deprecated Use useFilterByTag instead
 */
export function useFilterTags(tagId: string | null, entityType?: EntityType) {
  console.warn('useFilterTags is deprecated, use useFilterByTag instead');
  // You would typically call the new hook here and return its result
  // For demonstration, let's assume useFilterByTag returns the same type
  // return useFilterByTag(tagId, entityType);
  return {
    data: [],
    isLoading: false,
    error: null,
  };
}

/**
 * Deprecated: Use useSelectionTags instead
 * @deprecated Use useSelectionTags instead
 */
export function useTags(entityType?: EntityType) {
  console.warn('useTags is deprecated, use useSelectionTags instead');
  return useSelectionTags(entityType);
}
