
import React from "react";
import { TagAssignment } from "@/utils/tagUtils";
import TagBadge from "./TagBadge";

interface TagListProps {
  tagAssignments: TagAssignment[];
  onRemove?: (assignmentId: string) => void;
  className?: string;
  currentEntityType?: "person" | "organization";
}

const TagList = ({ 
  tagAssignments, 
  onRemove, 
  className, 
  currentEntityType 
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
          />
        );
      })}
    </div>
  );
};

export default TagList;
