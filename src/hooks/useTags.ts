
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEntityTags } from "@/utils/tags";
import { EntityType, isValidEntityType } from "@/types/entityTypes";
import { useTagAssignmentMutations as useTagsMutations } from "./tag";
import { useTagCrudMutations } from "./tag";
import { useTagQueries } from "./useTagQueries";

/**
 * Re-export query hooks from useTagQueries
 */
export const { useFilterTags, useSelectionTags } = useTagQueries;

/**
 * Main tag query hook for backward compatibility
 * Returns all tags that can be used for selection
 */
export const useTags = useTagQueries().useSelectionTags;

/**
 * Re-export tag crud mutations for backward compatibility
 */
export const useTagMutations = useTagCrudMutations;

/**
 * Hook for retrieving tags assigned to a specific entity
 */
export const useEntityTags = (entityId: string, entityType: EntityType | string) => {
  return useQuery({
    queryKey: ["entity-tags", entityId, entityType],
    queryFn: () => fetchEntityTags(entityId, entityType),
    enabled: !!entityId && isValidEntityType(entityType),
  });
};

/**
 * Re-export assignment mutations hook for backward compatibility
 * This ensures all entity components using tag assignments
 * are using the same underlying code
 */
export const useTagAssignmentMutations = useTagsMutations;
