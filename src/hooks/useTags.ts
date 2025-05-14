
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEntityTags } from "@/utils/tags";
import { EntityType, isValidEntityType } from "@/types/entityTypes";
import { useTagAssignmentMutations as useTagsMutations } from "./tag";

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

// Export other tag-related hooks as needed for backwards compatibility
