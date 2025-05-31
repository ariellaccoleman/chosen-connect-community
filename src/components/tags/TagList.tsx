
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/utils/tags/types";
import { cn } from "@/lib/utils";
import { logger } from "@/utils/logger";
import { X } from "lucide-react";
import { Loader2 } from "lucide-react";

interface TagListProps {
  // Simplified to only support Tag[] - no more TagAssignment[] complexity
  tags: Tag[];
  className?: string;
  maxTags?: number; 
  showDebugInfo?: boolean;
  onRemove?: (tagId: string, entityId: string, entityType: string) => void;
  isRemoving?: boolean;
  // Context for tag removal operations
  entityId?: string;
  entityType?: string;
}

/**
 * Component to display a list of tags as badges
 * Now only supports simplified Tag[] arrays from views
 */
const TagList = ({
  tags = [],
  className,
  maxTags = 10,
  showDebugInfo = false,
  onRemove,
  isRemoving = false,
  entityId,
  entityType
}: TagListProps) => {
  if (!tags || tags.length === 0) {
    return null;
  }

  // Enhanced logging for debugging specific tag issues
  if (showDebugInfo) {
    logger.debug("TagList received tags:", tags.map(t => ({
      id: t.id,
      name: t.name,
      type: 'simplified'
    })));
  }

  // In case we have more tags than we want to show
  const visibleTags = maxTags > 0 ? tags.slice(0, maxTags) : tags;
  const extraTagsCount = Math.max(0, tags.length - maxTags);

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {visibleTags.map((tag, index) => {
        if (!tag || !tag.name) {
          return null; // Skip invalid tags
        }
        
        // Generate a key - prefer tag.id, fallback to name + index
        const key = tag.id || `${tag.name}-${index}`;
        
        return (
          <Badge 
            key={key}
            variant="outline"
            className="text-xs px-2 py-0.5 bg-opacity-50 text-gray-700 dark:text-gray-300 flex items-center"
          >
            {tag.name}
            
            {onRemove && entityId && entityType && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove(tag.id, entityId, entityType);
                }}
                disabled={isRemoving}
                className="ml-1 focus:outline-none"
                aria-label="Remove tag"
              >
                {isRemoving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </button>
            )}
          </Badge>
        );
      })}
      
      {extraTagsCount > 0 && (
        <Badge 
          variant="outline"
          className="text-xs px-2 py-0.5 bg-opacity-50 text-gray-700 dark:text-gray-300"
        >
          +{extraTagsCount} more
        </Badge>
      )}
    </div>
  );
};

export default TagList;
