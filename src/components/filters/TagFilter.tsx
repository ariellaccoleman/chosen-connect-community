
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
  selectedTagId: string | null;
  onTagSelect: (tagId: string | null) => void;
  targetType?: EntityType | string;
}

const TagFilter: React.FC<TagFilterProps> = ({
  tags,
  isLoading,
  selectedTagId,
  onTagSelect,
  targetType
}) => {
  // Enhanced logging for debugging tag filtering
  React.useEffect(() => {
    logger.debug(`TagFilter mounted with:`, {
      tagsCount: tags.length,
      selectedTagId,
      targetType
    });
    
    if (tags.length > 0) {
      logger.debug(`Available tags:`, tags.map(tag => ({ id: tag.id, name: tag.name })));
    }
  }, [tags, selectedTagId, targetType]);

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
    onTagSelect(null);
  };

  const handleSelectTag = (tagId: string) => {
    logger.debug(`TagFilter: Selected tag ${tagId}`);
    onTagSelect(tagId);
  };

  return (
    <div className="mb-4">
      <div className="text-sm text-muted-foreground mb-2">Filter by tag:</div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selectedTagId === tag.id;
          
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
                    clearFilter();
                  }}
                />
              )}
            </Badge>
          );
        })}
        
        {selectedTagId && (
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
