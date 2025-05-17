import { useState, useMemo } from "react";
import { Entity } from "@/types/entity";
import { EntityType } from "@/types/entityTypes";
import { useFilterTags } from "./tags";
import { Tag } from "@/utils/tags/types";

interface UseTagFilterOptions {
  entityType?: EntityType;
}

/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please update your imports to use the modular structure:
 * import { useFilterTags } from '@/hooks/tags';
 */

/**
 * Hook for filtering entities by tag
 * @deprecated Please use hooks from '@/hooks/tags' directly.
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
      if (tagAssignments.length > 0) {
        const taggedIds = new Set(tagAssignments.map(ta => ta.target_id));
        return items.filter(item => taggedIds.has(item.id));
      }
      
      return [];
    };
  }, [selectedTagId, tagAssignments]);

  // Add deprecation console warning in development only
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'Deprecated import: Please update your imports to use modules from @/hooks/tags directly ' +
      'instead of @/hooks/useTagFilter which will be removed in a future release.'
    );
  }
  
  return {
    selectedTagId,
    setSelectedTagId,
    filterItemsByTag,
    tags: tags.map(ta => ta.tag).filter(Boolean) as Tag[],
    isLoading: isLoadingTagAssignments || isLoadingSelectionTags
  };
};
