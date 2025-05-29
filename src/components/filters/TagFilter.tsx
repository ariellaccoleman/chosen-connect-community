
import React, { useState } from "react";
import { Tag } from "@/utils/tags/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import { EntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";
import { useSelectionTags } from "@/hooks/tags/useTagFactoryHooks";

interface TagFilterProps {
  // Single tag selection mode props
  selectedTagId?: string | null;
  onTagSelect?: (tagId: string | null) => void;
  
  // Multiple tags selection mode props
  selectedTagIds?: string[];
  onTagsSelect?: (tagIds: string[]) => void;
  
  // Optional props
  targetType?: EntityType | string;
  label?: string;
}

const TagFilter: React.FC<TagFilterProps> = ({
  selectedTagId,
  onTagSelect,
  selectedTagIds,
  onTagsSelect,
  targetType,
  label
}) => {
  const { data: tagsResponse, isLoading } = useSelectionTags(targetType as EntityType);
  
  // Extract tags from the API response - handle both array and ApiResponse formats
  const tags = Array.isArray(tagsResponse) ? tagsResponse : (tagsResponse?.data || []);
  
  // Enhanced logging for debugging tag filtering
  React.useEffect(() => {
    logger.debug(`TagFilter mounted with:`, {
      tagsCount: tags.length,
      selectedTagId,
      selectedTagIds,
      targetType,
      mode: selectedTagIds ? 'multi' : 'single'
    });
    
    if (tags.length > 0) {
      logger.debug(`Available tags:`, tags.map(tag => ({ id: tag.id, name: tag.name })));
    }
  }, [tags, selectedTagId, selectedTagIds, targetType]);

  // Determine if we're in single or multi-select mode
  const isMultiSelectMode = selectedTagIds !== undefined && onTagsSelect !== undefined;

  if (isLoading) {
    return (
      <div className="mb-4">
        <div className="text-sm text-muted-foreground mb-2">
          {label || "Filter by tag:"}
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    );
  }

  if (!tags || tags.length === 0) {
    return null;
  }

  const clearFilter = () => {
    logger.debug(`TagFilter: Clearing selection`);
    if (isMultiSelectMode && onTagsSelect) {
      onTagsSelect([]);
    } else if (onTagSelect) {
      onTagSelect(null);
    }
  };

  const handleSelectTag = (tagId: string) => {
    logger.debug(`TagFilter: Selected tag ${tagId}`);
    
    if (isMultiSelectMode && onTagsSelect) {
      // Handle multi-select mode
      const currentTags = [...(selectedTagIds || [])];
      
      if (currentTags.includes(tagId)) {
        // Remove tag if already selected
        onTagsSelect(currentTags.filter(id => id !== tagId));
      } else {
        // Add tag if not already selected
        onTagsSelect([...currentTags, tagId]);
      }
    } else if (onTagSelect) {
      // Handle single-select mode
      if (selectedTagId === tagId) {
        // If clicking on the already selected tag, clear it
        onTagSelect(null);
      } else {
        onTagSelect(tagId);
      }
    }
  };
  
  // Determine if a tag is selected based on the mode
  const isTagSelected = (tagId: string): boolean => {
    if (isMultiSelectMode) {
      return selectedTagIds?.includes(tagId) || false;
    }
    return selectedTagId === tagId;
  };

  // Get selected tag names for display
  const getSelectedTagNames = (): string[] => {
    if (isMultiSelectMode && selectedTagIds) {
      return tags.filter(tag => selectedTagIds.includes(tag.id)).map(tag => tag.name);
    } else if (selectedTagId) {
      const selectedTag = tags.find(tag => tag.id === selectedTagId);
      return selectedTag ? [selectedTag.name] : [];
    }
    return [];
  };

  const selectedTagNames = getSelectedTagNames();

  return (
    <div className="mb-4">
      <div className="text-sm text-muted-foreground mb-2">
        {label || "Filter by tag:"}
      </div>
      
      {/* Show selected tags prominently */}
      {selectedTagNames.length > 0 && (
        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">Selected:</div>
          <div className="flex flex-wrap gap-1">
            {selectedTagNames.map((tagName, index) => (
              <Badge
                key={index}
                variant="default"
                className="bg-blue-600 text-white flex items-center gap-1"
              >
                {tagName}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFilter();
                  }}
                />
              </Badge>
            ))}
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={clearFilter}
            >
              Clear all <X className="ml-1 h-3 w-3" />
            </Badge>
          </div>
        </div>
      )}
      
      {/* Available tags */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = isTagSelected(tag.id);
          
          return (
            <Badge
              key={tag.id}
              variant={isSelected ? "default" : "outline"}
              className={`cursor-pointer ${
                isSelected ? "bg-primary" : "hover:bg-primary/10"
              }`}
              onClick={() => handleSelectTag(tag.id)}
            >
              {tag.name}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export default TagFilter;
