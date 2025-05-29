
import { useQuery } from "@tanstack/react-query";
import { extendedTagApi } from "@/api/tags/factory/tagApiFactory";
import { Tag } from "@/utils/tags/types";
import { EntityType, isValidEntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";

/**
 * Hook to fetch all tags using the simplified API
 */
export function useTags() {
  return useQuery({
    queryKey: ["tags", "all"],
    queryFn: async () => {
      logger.debug("useTags: Fetching all tags");
      const response = await extendedTagApi.getAll();
      if (response.error) {
        logger.error("useTags: Error fetching tags:", response.error);
        throw response.error;
      }
      logger.debug(`useTags: Found ${response.data?.length || 0} tags`);
      return response.data || [];
    }
  });
}

/**
 * Hook to fetch tags by entity type using business operations
 */
export function useTagsByEntityType(entityType: EntityType) {
  return useQuery({
    queryKey: ["tags", "byEntityType", entityType],
    queryFn: async () => {
      if (!isValidEntityType(entityType)) {
        logger.warn(`Invalid entity type: ${entityType}`);
        return [];
      }
      logger.debug(`useTagsByEntityType: Fetching tags for entity type ${entityType}`);
      const response = await extendedTagApi.getByEntityType(entityType);
      if (response.error) {
        logger.error(`useTagsByEntityType: Error fetching tags for ${entityType}:`, response.error);
        throw response.error;
      }
      logger.debug(`useTagsByEntityType: Found ${response.data?.length || 0} tags for ${entityType}`);
      return response.data || [];
    },
    enabled: isValidEntityType(entityType)
  });
}

/**
 * Hook to fetch a single tag by ID
 */
export function useTag(id: string | null | undefined) {
  return useQuery({
    queryKey: ["tags", "byId", id],
    queryFn: async () => {
      if (!id) return null;
      logger.debug(`useTag: Fetching tag with ID ${id}`);
      const response = await extendedTagApi.getById(id);
      if (response.error) {
        logger.error(`useTag: Error fetching tag ${id}:`, response.error);
        throw response.error;
      }
      logger.debug(`useTag: Found tag:`, response.data);
      return response.data || null;
    },
    enabled: !!id
  });
}

/**
 * Hook to search tags by name using business operations
 */
export function useTagSearch(searchQuery: string) {
  return useQuery({
    queryKey: ["tags", "search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      logger.debug(`useTagSearch: Searching for tags with query "${searchQuery}"`);
      const response = await extendedTagApi.searchByName(searchQuery);
      if (response.error) {
        logger.error(`useTagSearch: Error searching tags:`, response.error);
        throw response.error;
      }
      logger.debug(`useTagSearch: Found ${response.data?.length || 0} tags matching "${searchQuery}"`);
      return response.data || [];
    },
    enabled: !!searchQuery.trim()
  });
}

/**
 * Hook to find a tag by exact name
 */
export function useTagByName(name: string | null | undefined) {
  return useQuery({
    queryKey: ["tags", "byName", name],
    queryFn: async () => {
      if (!name) return null;
      logger.debug(`useTagByName: Finding tag with name "${name}"`);
      const response = await extendedTagApi.getAll({ filters: { name } });
      if (response.error) {
        logger.error(`useTagByName: Error finding tag by name:`, response.error);
        throw response.error;
      }
      const tag = response.data?.[0] || null;
      logger.debug(`useTagByName: Found tag:`, tag);
      return tag;
    },
    enabled: !!name
  });
}
