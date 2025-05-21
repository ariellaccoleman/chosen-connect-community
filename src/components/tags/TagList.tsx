
import React from "react";
import { Badge } from "@/components/ui/badge";
import { TagAssignment } from "@/utils/tags/types";

interface TagListProps {
  tagAssignments: TagAssignment[];
  className?: string;
  size?: "sm" | "md";
}

const TagList: React.FC<TagListProps> = ({ 
  tagAssignments = [], 
  className = "", 
  size = "md" 
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
          className={`${size === "sm" ? "px-2 py-0 text-xs" : "px-3 py-1"}`}
        >
          {assignment.tag.name}
        </Badge>
      ))}
    </div>
  );
};

export default TagList;
