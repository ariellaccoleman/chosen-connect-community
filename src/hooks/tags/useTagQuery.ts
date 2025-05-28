
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
      return await extendedTagApi.getAll();
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
      return await extendedTagApi.getByEntityType(entityType);
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
      return await extendedTagApi.getById(id);
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
      return await extendedTagApi.searchByName(searchQuery);
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
      return await extendedTagApi.findByName(name);
    },
    enabled: !!name
  });
}
