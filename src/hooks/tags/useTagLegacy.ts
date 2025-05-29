
import { useQuery } from "@tanstack/react-query";
import { tagApi } from "@/api/tags/factory/tagApiFactory";
import { EntityType, isValidEntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";

/**
 * Simplified hook to fetch tags for selection lists
 * Now relies only on React Query caching (no database cache)
 */
export function useSelectionTags(entityType?: EntityType) {
  return useQuery({
    queryKey: ["tags", "selection", entityType],
    queryFn: async () => {
      try {
        if (entityType && !isValidEntityType(entityType)) {
          logger.warn(`Invalid entity type passed to useSelectionTags: ${entityType}`);
          return [];
        }
        
        // Use the tagApi and unwrap the response
        const response = await tagApi.getAll();
        if (response.error) {
          logger.error("Error in useSelectionTags:", response.error);
          throw new Error(response.error.message || "Failed to fetch tags");
        }
        
        const tags = response.data || [];
        logger.debug(`useSelectionTags: Found ${tags.length} tags for entity type ${entityType || 'all'}`);
        
        return tags;
      } catch (error) {
        logger.error("Error in useSelectionTags:", error);
        throw error;
      }
    },
    staleTime: 30000 // Cache for 30 seconds via React Query
  });
}

/**
 * Deprecated: Use useFilterByTag instead
 * @deprecated Use useFilterByTag instead
 */
export function useFilterTags(tagId: string | null, entityType?: EntityType) {
  console.warn('useFilterTags is deprecated, use useFilterByTag instead');
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
