
import { Badge } from "@/components/ui/badge";
import { TagAssignment } from "@/utils/tags/types";
import { cn } from "@/lib/utils";
import { logger } from "@/utils/logger";
import { X } from "lucide-react";
import { Loader2 } from "lucide-react";

interface TagListProps {
  tagAssignments: TagAssignment[] | undefined;
  className?: string;
  maxTags?: number; 
  showDebugInfo?: boolean; // Option to show more debug info in console
  onRemove?: (assignmentId: string) => void; // Added this prop
  isRemoving?: boolean; // Added this prop
}

/**
 * Component to display a list of tags as badges
 */
const TagList = ({
  tagAssignments,
  className,
  maxTags = 10,
  showDebugInfo = false,
  onRemove,
  isRemoving = false
}: TagListProps) => {
  if (!tagAssignments || tagAssignments.length === 0) {
    return null;
  }

  // Enhanced logging for debugging specific tag issues
  if (showDebugInfo) {
    logger.debug("TagList received tagAssignments:", 
      tagAssignments.map(t => ({
        id: t.id,
        tag_id: t.tag_id,
        target_id: t.target_id,
        target_type: t.target_type,
        tag: t.tag ? { id: t.tag.id, name: t.tag.name } : null
      }))
    );
  }

  // In case we have more tags than we want to show
  const displayTags = maxTags > 0 ? tagAssignments.slice(0, maxTags) : tagAssignments;
  const extraTagsCount = Math.max(0, tagAssignments.length - maxTags);

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {displayTags.map((tagAssignment) => {
        if (!tagAssignment.tag) {
          return null; // Skip tags that don't have a tag object
        }
        
        return (
          <Badge 
            key={tagAssignment.id} 
            variant="outline"
            className="text-xs px-2 py-0.5 bg-opacity-50 text-gray-700 dark:text-gray-300 flex items-center"
          >
            {tagAssignment.tag.name || "Unnamed tag"}
            
            {onRemove && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove(tagAssignment.id);
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
