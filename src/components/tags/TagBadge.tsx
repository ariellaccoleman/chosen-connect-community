
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
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800", 
        className
      )}
    >
      <span className="flex items-center">
        <span>{name}</span>
        {/* Only show entity type if isFromDifferentEntityType is true AND showEntityType is true */}
        {isFromDifferentEntityType && entityType && showEntityType && (
          <span className="ml-1 text-xs text-muted-foreground">
            ({entityType === "person" ? "People" : "Organizations"})
          </span>
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
