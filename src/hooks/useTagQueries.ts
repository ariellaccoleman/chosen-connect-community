
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
    queryFn: () => getEntityTags(entityId, entityType),
    enabled: !!entityId && !!entityType,
  });
};

/**
 * Hook for filtering entities by tag
 */
export const useFilterTags = (tagId: string | null, entityType?: string) => {
  return useQuery<TagAssignment[]>({
    queryKey: ["filter-tags", tagId, entityType],
    queryFn: () => getEntitiesWithTag(tagId as string, entityType),
    enabled: !!tagId,
    initialData: [],
  });
};

/**
 * Hook for retrieving tags for selection UI
 */
export const useSelectionTags = (entityType?: string) => {
  return useQuery({
    queryKey: ["selection-tags", entityType],
    queryFn: () => {
      // Convert the string parameter to an object with targetType property
      return getSelectionTags(entityType ? { targetType: entityType } : undefined);
    },
  });
};
