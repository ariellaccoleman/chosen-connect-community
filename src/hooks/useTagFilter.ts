
import { useState } from "react";
import { Tag, TagAssignment } from "@/utils/tags";
import { toast } from "@/components/ui/sonner";
import { EntityType } from "@/types/entityTypes";
import { useTagQueries } from "./useTagQueries";

interface UseTagFilterOptions {
  entityType?: EntityType;
  enabled?: boolean;
}

interface UseTagFilterResult {
  selectedTagId: string | null;
  setSelectedTagId: (tagId: string | null) => void;
  tags: Tag[];
  isLoading: boolean;
  filterItemsByTag: <T extends { tags?: TagAssignment[] }>(items: T[]) => T[];
}

/**
 * Custom hook for tag filtering functionality
 * Can be used across different components that need tag filtering
 */
export const useTagFilter = (options: UseTagFilterOptions = {}): UseTagFilterResult => {
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  
  // Fetch tags for the entity type - using filterTags which returns only tags actually used with this entity type
  const { useFilterTags } = useTagQueries();
  const { data: tags = [], isLoading, error } = useFilterTags({
    targetType: options.entityType,
    enabled: options.enabled !== false
  });
  
  // Show error toast only once if tag loading fails
  if (error) {
    console.error("Error loading tags:", error);
    toast.error("Failed to load tags. Please try again.");
  }
  
  /**
   * Filter an array of items by the selected tag
   * @param items Array of items that might have tags property
   * @returns Filtered array based on selected tag
   */
  const filterItemsByTag = <T extends { tags?: TagAssignment[] }>(items: T[]): T[] => {
    if (!selectedTagId) return items;
    
    return items.filter(item => 
      item.tags && item.tags.some(tagAssignment => tagAssignment.tag_id === selectedTagId)
    );
  };
  
  return {
    selectedTagId,
    setSelectedTagId,
    tags,
    isLoading,
    filterItemsByTag
  };
};
