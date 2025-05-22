
import React from "react";
import { Tag } from "@/utils/tags/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import { EntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";

interface TagFilterProps {
  tags: Tag[];
  isLoading: boolean;
  
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
  tags,
  isLoading,
  selectedTagId,
  onTagSelect,
  selectedTagIds,
  onTagsSelect,
  targetType,
  label
}) => {
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
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
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

  return (
    <div className="mb-4">
      <div className="text-sm text-muted-foreground mb-2">
        {label || "Filter by tag:"}
      </div>
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
              {isSelected && (
                <X
                  className="ml-1 h-3 w-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isMultiSelectMode && onTagsSelect) {
                      onTagsSelect(selectedTagIds?.filter(id => id !== tag.id) || []);
                    } else if (onTagSelect) {
                      onTagSelect(null);
                    }
                  }}
                />
              )}
            </Badge>
          );
        })}
        
        {(selectedTagId || (selectedTagIds && selectedTagIds.length > 0)) && (
          <Badge
            variant="secondary"
            className="cursor-pointer"
            onClick={clearFilter}
          >
            Clear filter <X className="ml-1 h-3 w-3" />
          </Badge>
        )}
      </div>
    </div>
  );
};

export default TagFilter;
