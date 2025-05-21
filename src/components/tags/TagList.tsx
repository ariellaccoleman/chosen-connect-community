
import React from "react";
import { Badge } from "@/components/ui/badge";
import { TagAssignment } from "@/utils/tags/types";
import { EntityType } from "@/types/entityTypes";
import { X } from "lucide-react";

interface TagListProps {
  tagAssignments: TagAssignment[];
  className?: string;
  size?: "sm" | "md";
  currentEntityType?: EntityType;
  onRemove?: (assignmentId: string) => void;
  isRemoving?: boolean;
}

const TagList: React.FC<TagListProps> = ({ 
  tagAssignments = [], 
  className = "", 
  size = "md",
  currentEntityType,
  onRemove,
  isRemoving = false
}) => {
  // Early return if no tags
  if (!tagAssignments || tagAssignments.length === 0) {
    return null;
  }

  // Make sure we have valid tag assignments with tag objects
  const validAssignments = tagAssignments.filter(
    assignment => assignment.tag && assignment.tag.name
  );

  if (validAssignments.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {validAssignments.map((assignment) => (
        <Badge 
          key={`tag-${assignment.tag_id}`}
          variant="outline" 
          className={`${size === "sm" ? "px-2 py-0 text-xs" : "px-3 py-1"} ${onRemove ? "pr-1" : ""}`}
        >
          <span>{assignment.tag.name}</span>
          
          {onRemove && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(assignment.id);
              }}
              disabled={isRemoving}
              className="ml-1 rounded-full hover:bg-gray-200 p-1"
              aria-label={`Remove ${assignment.tag.name} tag`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
    </div>
  );
};

export default TagList;
