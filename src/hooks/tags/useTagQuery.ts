
/**
 * Tag Query Hooks
 * Provides hooks for reading tag data
 */
import { useQuery } from '@tanstack/react-query';
import { EntityType, isValidEntityType } from '@/types/entityTypes';
import { logger } from '@/utils/logger';
import { Tag } from '@/utils/tags/types';
import { tagApi, tagAssignmentApi } from '@/api/tags';

/**
 * Hook to fetch tags filtered by entity type
 */
export function useTagQuery(entityType?: EntityType) {
  return useQuery({
    queryKey: ["tags", "query", entityType],
    queryFn: async () => {
      try {
        if (entityType) {
          if (!isValidEntityType(entityType)) {
            logger.warn(`Invalid entity type passed to useTagQuery: ${entityType}`);
            return [];
          }
          return await tagApi.getByEntityType(entityType);
        }
        return await tagApi.getAll();
      } catch (error) {
        logger.error("Error in useTagQuery:", error);
        throw error;
      }
    },
    staleTime: 30000
  });
}

/**
 * Hook to fetch a specific tag by ID
 */
export function useTagById(tagId: string | null) {
  return useQuery({
    queryKey: ["tags", "byId", tagId],
    queryFn: async () => {
      if (!tagId) return null;
      try {
        return await tagApi.getById(tagId);
      } catch (error) {
        logger.error(`Error fetching tag with ID ${tagId}:`, error);
        throw error;
      }
    },
    enabled: !!tagId
  });
}

/**
 * Hook to find a tag by name
 */
export function useFindTagByName(name: string | null) {
  return useQuery({
    queryKey: ["tags", "byName", name],
    queryFn: async () => {
      if (!name) return null;
      try {
        return await tagApi.findByName(name);
      } catch (error) {
        logger.error(`Error finding tag with name "${name}":`, error);
        throw error;
      }
    },
    enabled: !!name
  });
}

/**
 * Hook to fetch all available tags
 */
export function useAllTags() {
  return useQuery({
    queryKey: ["tags", "all"],
    queryFn: async () => {
      try {
        return await tagApi.getAll();
      } catch (error) {
        logger.error("Error fetching all tags:", error);
        throw error;
      }
    },
    staleTime: 60000 // Cache for 1 minute
  });
}

