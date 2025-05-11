
import React from "react";
import { TagAssignment } from "@/utils/tagUtils";
import TagBadge from "./TagBadge";

interface TagListProps {
  tagAssignments: TagAssignment[];
  onRemove?: (assignmentId: string) => void;
  className?: string;
}

const TagList = ({ tagAssignments, onRemove, className }: TagListProps) => {
  if (!tagAssignments || tagAssignments.length === 0) {
    return <div className="text-sm text-muted-foreground">No tags assigned</div>;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className || ""}`}>
      {tagAssignments.map((assignment) => (
        <TagBadge
          key={assignment.id}
          name={assignment.tag?.name || "Unknown tag"}
          isRemovable={!!onRemove}
          onRemove={onRemove ? () => onRemove(assignment.id) : undefined}
        />
      ))}
    </div>
  );
};

export default TagList;
