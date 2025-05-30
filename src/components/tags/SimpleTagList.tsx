
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/utils/tags/types";
import { cn } from "@/lib/utils";

interface SimpleTagListProps {
  tags: Tag[] | undefined;
  className?: string;
  maxTags?: number;
}

/**
 * Simple component to display tags directly without TagAssignment wrapper
 */
const SimpleTagList = ({
  tags,
  className,
  maxTags = 10
}: SimpleTagListProps) => {
  if (!tags || tags.length === 0) {
    return null;
  }

  // In case we have more tags than we want to show
  const displayTags = maxTags > 0 ? tags.slice(0, maxTags) : tags;
  const extraTagsCount = Math.max(0, tags.length - maxTags);

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {displayTags.map((tag) => {
        if (!tag?.id || !tag?.name) {
          return null; // Skip invalid tags
        }
        
        return (
          <Badge 
            key={tag.id} 
            variant="outline"
            className="text-xs px-2 py-0.5 bg-opacity-50 text-gray-700 dark:text-gray-300"
          >
            {tag.name}
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

export default SimpleTagList;
