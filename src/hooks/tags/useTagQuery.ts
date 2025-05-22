
/**
 * Tag Query Hooks
 * Provides hooks for reading tag data
 */
import { useQuery } from '@tanstack/react-query';
import { EntityType, isValidEntityType } from '@/types/entityTypes';
import { logger } from '@/utils/logger';
import { Tag } from '@/utils/tags/types';
import { createTagService, createTagAssignmentService } from '@/api/tags/services';

// Create service instances
const tagService = createTagService();
const tagAssignmentService = createTagAssignmentService();

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
        
        // Use the tag service to fetch all tags
        return tagService.getAllTags();
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
        // Use the tag assignment service to filter entities
        const response = await tagAssignmentService.getEntitiesWithTag(tagId, entityType);
        return response.data || [];
      } catch (e) {
        logger.error(`useFilterByTag: Exception fetching tag assignments`, e);
        return [];
      }
    },
    enabled: !!tagId // Only run query if tagId is provided
  });
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
      
      return tagAssignmentService.getTagsForEntity(entityId, entityType);
    },
    enabled: !!entityId && isValidEntityType(entityType)
  });
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
