
import React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  name: string;
  isRemovable?: boolean;
  onRemove?: () => void;
  className?: string;
  entityType?: string;
  isFromDifferentEntityType?: boolean;
  showEntityType?: boolean;
}

const TagBadge = ({
  name,
  isRemovable = false,
  onRemove,
  className,
  entityType,
  isFromDifferentEntityType = false,
  showEntityType = false,
}: TagBadgeProps) => {
  // Determine the color based on entity type
  let badgeClasses = "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800";
  
  if (entityType === 'event') {
    badgeClasses = "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:text-purple-800";
  } else if (entityType === 'organization') {
    badgeClasses = "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800";
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(
        badgeClasses,
        isFromDifferentEntityType && "opacity-70",
        className
      )}
    >
      <span className="flex items-center">
        <span>{name}</span>
        {showEntityType && entityType && (
          <span className="ml-1 text-xs opacity-75">({entityType})</span>
        )}
      </span>
      {isRemovable && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
          aria-label={`Remove ${name} tag`}
        >
          <X size={12} />
        </button>
      )}
    </Badge>
  );
};

export default TagBadge;
