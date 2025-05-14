
import { useState, useMemo } from "react";
import { Entity } from "@/types/entity";
import { EntityType } from "@/types/entityTypes";
import { useFilterTags } from "./useTagQueries";
import { Tag } from "@/utils/tags/types";

interface UseTagFilterOptions {
  entityType?: EntityType;
}

/**
 * Hook for filtering entities by tag
 */
export const useTagFilter = (options: UseTagFilterOptions = {}) => {
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const { data: tagAssignments = [], isLoading: isLoadingTagAssignments } = useFilterTags(selectedTagId, options.entityType);
  const { data: tags = [], isLoading: isLoadingSelectionTags } = useFilterTags(null, options.entityType);

  /**
   * Filter items by tag assignment
   */
  const filterItemsByTag = useMemo(() => {
    return (items: Entity[]): Entity[] => {
      if (!selectedTagId) return items;
      
      // If we have tag assignments, filter items by matching IDs
      if (tagAssignments && tagAssignments.length > 0) {
        const taggedIds = new Set(tagAssignments.map(ta => ta.target_id));
        return items.filter(item => taggedIds.has(item.id));
      }
      
      return [];
    };
  }, [selectedTagId, tagAssignments]);

  return {
    selectedTagId,
    setSelectedTagId,
    filterItemsByTag,
    tags: tags && tags.length > 0 ? tags.map(ta => ta.tag).filter(Boolean) as Tag[] : [],
    isLoading: isLoadingTagAssignments || isLoadingSelectionTags
  };
};
