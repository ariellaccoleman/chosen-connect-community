
import { Badge } from "@/components/ui/badge";
import { TagAssignment } from "@/utils/tags/types";
import { cn } from "@/lib/utils";
import { logger } from "@/utils/logger";
import { X } from "lucide-react";
import { Loader2 } from "lucide-react";

interface TagListProps {
  // Updated to support both legacy TagAssignment[] and new aggregated tag arrays
  tagAssignments?: TagAssignment[];
  tags?: any[]; // New prop for aggregated tags from views
  className?: string;
  maxTags?: number; 
  showDebugInfo?: boolean;
  onRemove?: (assignmentId: string) => void;
  isRemoving?: boolean;
}

/**
 * Component to display a list of tags as badges
 * Now supports both legacy TagAssignment[] and new aggregated tag arrays
 */
const TagList = ({
  tagAssignments,
  tags,
  className,
  maxTags = 10,
  showDebugInfo = false,
  onRemove,
  isRemoving = false
}: TagListProps) => {
  // Determine which tag data to use
  let displayTags: any[] = [];
  
  if (tags && tags.length > 0) {
    // Use new aggregated tags from views
    displayTags = tags;
  } else if (tagAssignments && tagAssignments.length > 0) {
    // Use legacy tag assignments (convert to simple tag objects)
    displayTags = tagAssignments
      .filter(assignment => assignment.tag)
      .map(assignment => assignment.tag);
  }

  if (displayTags.length === 0) {
    return null;
  }

  // Enhanced logging for debugging specific tag issues
  if (showDebugInfo) {
    logger.debug("TagList received tags:", displayTags.map(t => ({
      id: t.id,
      name: t.name,
      type: tags ? 'aggregated' : 'assignment'
    })));
  }

  // In case we have more tags than we want to show
  const visibleTags = maxTags > 0 ? displayTags.slice(0, maxTags) : displayTags;
  const extraTagsCount = Math.max(0, displayTags.length - maxTags);

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
            
            {onRemove && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // For legacy assignments, pass the assignment ID
                  // For new aggregated tags, we'd need a different approach
                  const idToRemove = tagAssignments 
                    ? tagAssignments.find(a => a.tag?.id === tag.id)?.id 
                    : tag.id;
                  if (idToRemove) {
                    onRemove(idToRemove);
                  }
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
