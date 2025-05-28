
import { useQuery } from "@tanstack/react-query";
import { extendedTagApi } from "@/api/tags/factory/tagApiFactory";
import { Tag } from "@/utils/tags/types";
import { EntityType, isValidEntityType } from "@/types/entityTypes";

/**
 * Hook to fetch all tags
 */
export function useTags() {
  return useQuery({
    queryKey: ["tags", "all"],
    queryFn: async () => {
      const response = await extendedTagApi.getAll();
      if (response.error) {
        throw response.error;
      }
      return response.data || [];
    }
  });
}

/**
 * Hook to fetch tags by entity type
 */
export function useTagsByEntityType(entityType: EntityType) {
  return useQuery({
    queryKey: ["tags", "byEntityType", entityType],
    queryFn: async () => {
      if (!isValidEntityType(entityType)) {
        throw new Error(`Invalid entity type: ${entityType}`);
      }
      const response = await extendedTagApi.getByEntityType(entityType);
      if (response.error) {
        throw response.error;
      }
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
      const response = await extendedTagApi.getById(id);
      if (response.error) {
        throw response.error;
      }
      return response.data || null;
    },
    enabled: !!id
  });
}

/**
 * Hook to search tags by name
 */
export function useTagSearch(searchQuery: string) {
  return useQuery({
    queryKey: ["tags", "search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await extendedTagApi.searchByName(searchQuery);
      if (response.error) {
        throw response.error;
      }
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
      const response = await extendedTagApi.findByName(name);
      if (response.error) {
        throw response.error;
      }
      return response.data || null;
    },
    enabled: !!name
  });
}
