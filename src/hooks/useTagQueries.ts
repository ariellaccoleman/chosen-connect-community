
import { useQuery } from "@tanstack/react-query";
import { tagApi } from "@/api/tags";
import { TagAssignment } from "@/utils/tags/types";

/**
 * Hook for querying entity tags
 */
export const useEntityTags = (entityId: string, entityType: string) => {
  return useQuery({
    queryKey: ["entity-tags", entityId, entityType],
    queryFn: () => tagApi.getTagsForEntity(entityId, entityType),
    enabled: !!entityId && !!entityType,
  });
};

/**
 * Hook for filtering entities by tag
 */
export const useFilterTags = (tagId: string | null, entityType?: string) => {
  return useQuery<TagAssignment[]>({
    queryKey: ["filter-tags", tagId, entityType],
    queryFn: () => tagApi.getEntitiesWithTag(tagId as string, entityType),
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
    queryFn: () => tagApi.getSelectionTags(entityType),
  });
};
