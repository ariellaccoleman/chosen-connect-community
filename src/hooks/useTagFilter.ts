
/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please update your imports to use the modular structure:
 * import { useFilterTags, useSelectionTags } from '@/hooks/tags';
 */

import { useState, useMemo } from "react";
import { Entity } from "@/types/entity";
import { EntityType } from "@/types/entityTypes";
import { useFilterTags, useSelectionTags } from "@/hooks/tags";
import { TagAssignment } from "@/utils/tags/types";

interface UseTagFilterOptions {
  entityType?: EntityType;
}

/**
 * Hook for filtering entities by tag
 * @deprecated Please use hooks from '@/hooks/tags' directly.
 */
export const useTagFilter = (options: UseTagFilterOptions = {}) => {
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const { data: tagAssignments = [], isLoading: isLoadingTagAssignments } = useFilterTags(selectedTagId, options.entityType);
  const { data: tagsResponse, isLoading: isLoadingSelectionTags } = useSelectionTags(options.entityType);

  // Extract tags from the response - ensure we handle the data structure correctly
  const tags = tagsResponse?.data?.filter(Boolean) || [];

  /**
   * Filter items by tag assignment
   */
  const filterItemsByTag = useMemo(() => {
    return (items: Entity[]): Entity[] => {
      if (!selectedTagId) return items;
      
      // If we have tag assignments, filter items by matching IDs
      if (tagAssignments.length > 0) {
        const taggedIds = new Set(tagAssignments.map((ta: TagAssignment) => ta.target_id));
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
    tags,
    isLoading: isLoadingTagAssignments || isLoadingSelectionTags
  };
};
