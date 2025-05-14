
import { useState, useMemo } from "react";
import { Entity } from "@/types/entity";
import { EntityType } from "@/types/entityTypes";
import { useFilterTags } from "./useTagQueries";

interface UseTagFilterOptions {
  entityType?: EntityType;
}

/**
 * Hook for filtering entities by tag
 */
export const useTagFilter = (options: UseTagFilterOptions = {}) => {
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const { data: tagAssignments = [] } = useFilterTags(selectedTagId, options.entityType);

  /**
   * Filter items by tag assignment
   */
  const filterItemsByTag = useMemo(() => {
    return (items: Entity[]): Entity[] => {
      if (!selectedTagId) return items;
      
      // If we have tag assignments, filter items by matching IDs
      if (tagAssignments.length > 0) {
        const taggedIds = new Set(tagAssignments.map(ta => ta.target_id));
        return items.filter(item => taggedIds.has(item.id));
      }
      
      return [];
    };
  }, [selectedTagId, tagAssignments]);

  return {
    selectedTagId,
    setSelectedTagId,
    filterItemsByTag
  };
};
