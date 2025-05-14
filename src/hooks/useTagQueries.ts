
import { useQuery } from "@tanstack/react-query";
import { getEntityTags, getEntitiesWithTag, getSelectionTags } from "@/api/tags";
import { TagAssignment } from "@/utils/tags/types";
import { EntityType } from "@/types/entityTypes";

/**
 * Hook for querying entity tags
 */
export const useEntityTags = (entityId: string, entityType: string) => {
  return useQuery({
    queryKey: ["entity-tags", entityId, entityType],
    queryFn: async () => {
      const response = await getEntityTags(entityId, entityType);
      return response.status === 'success' ? response.data || [] : [];
    },
    enabled: !!entityId && !!entityType,
  });
};

/**
 * Hook for filtering entities by tag
 */
export const useFilterTags = (tagId: string | null, entityType?: string) => {
  return useQuery<TagAssignment[]>({
    queryKey: ["filter-tags", tagId, entityType],
    queryFn: async () => {
      if (!tagId) return [];
      const response = await getEntitiesWithTag(tagId, entityType);
      return response.status === 'success' ? response.data || [] : [];
    },
    enabled: !!tagId,
  });
};

/**
 * Hook for retrieving tags for selection UI
 */
export const useSelectionTags = (entityType?: string) => {
  return useQuery({
    queryKey: ["selection-tags", entityType],
    queryFn: async () => {
      // Convert the string parameter to an object with targetType property
      const response = await getSelectionTags(entityType ? { targetType: entityType } : undefined);
      return response;
    },
  });
};
