
import React from "react";
import { TagAssignment } from "@/utils/tagUtils";
import TagBadge from "./TagBadge";

interface TagListProps {
  tagAssignments: TagAssignment[];
  onRemove?: (assignmentId: string) => void;
  className?: string;
  currentEntityType?: "person" | "organization";
  hideEntityType?: boolean; // Add option to hide entity type
}

const TagList = ({ 
  tagAssignments, 
  onRemove, 
  className, 
  currentEntityType,
  hideEntityType = false 
}: TagListProps) => {
  if (!tagAssignments || tagAssignments.length === 0) {
    return <div className="text-sm text-muted-foreground">No tags assigned</div>;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className || ""}`}>
      {tagAssignments.map((assignment) => {
        const tag = assignment.tag;
        const isFromDifferentEntityType = tag?.used_entity_types && 
          currentEntityType && 
          !tag.used_entity_types.includes(currentEntityType);
          
        return (
          <TagBadge
            key={assignment.id}
            name={tag?.name || "Unknown tag"}
            isRemovable={!!onRemove}
            onRemove={onRemove ? () => onRemove(assignment.id) : undefined}
            entityType={assignment.target_type}
            isFromDifferentEntityType={isFromDifferentEntityType}
            hideEntityType={hideEntityType}
          />
        );
      })}
    </div>
  );
};

export default TagList;
