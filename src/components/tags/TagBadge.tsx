
import React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tag } from "@/utils/tags";

interface TagBadgeProps {
  name?: string;
  isRemovable?: boolean;
  onRemove?: () => void;
  className?: string;
  entityType?: string;
  isFromDifferentEntityType?: boolean;
  showEntityType?: boolean;
  isRemoving?: boolean;
  // Add support for passing a Tag object
  tag?: Tag;
}

const TagBadge = ({
  name,
  isRemovable = false,
  onRemove,
  className,
  entityType,
  isFromDifferentEntityType = false,
  showEntityType = false,
  isRemoving = false,
  tag,
}: TagBadgeProps) => {
  // Use the tag object if provided, otherwise use the individual props
  const tagName = tag ? tag.name : name;
  const tagType = entityType;

  // Determine the color based on entity type
  let badgeClasses = "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800";
  
  if (tagType === 'event') {
    badgeClasses = "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:text-purple-800";
  } else if (tagType === 'organization') {
    badgeClasses = "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800";
  }

  if (!tagName) {
    return null;
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-xs px-2 py-1 min-h-[24px] inline-flex items-center gap-1",
        badgeClasses,
        isFromDifferentEntityType && "opacity-70",
        className
      )}
    >
      <span className="whitespace-nowrap">{tagName}</span>
      {showEntityType && tagType && (
        <span className="text-xs opacity-75">({tagType})</span>
      )}
      {isRemovable && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-1 hover:bg-blue-200 rounded-full p-0.5 flex-shrink-0"
          aria-label={`Remove ${tagName} tag`}
        >
          <X size={12} />
        </button>
      )}
    </Badge>
  );
};

export default TagBadge;
