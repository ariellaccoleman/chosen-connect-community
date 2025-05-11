
import React, { useState, useEffect } from "react";
import { TagAssignment, getTagEntityTypes } from "@/utils/tagUtils";
import TagBadge from "./TagBadge";

interface TagListProps {
  tagAssignments: TagAssignment[];
  onRemove?: (assignmentId: string) => void;
  className?: string;
  currentEntityType?: "person" | "organization";
  hideEntityType?: boolean;
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
      {tagAssignments.map((assignment) => (
        <TagAssignmentItem 
          key={assignment.id}
          assignment={assignment}
          onRemove={onRemove}
          currentEntityType={currentEntityType}
          hideEntityType={hideEntityType}
        />
      ))}
    </div>
  );
};

// Separate component to handle entity type check with hooks
const TagAssignmentItem = ({ 
  assignment, 
  onRemove,
  currentEntityType,
  hideEntityType
}: { 
  assignment: TagAssignment;
  onRemove?: (assignmentId: string) => void;
  currentEntityType?: "person" | "organization";
  hideEntityType?: boolean;
}) => {
  const [isFromDifferentEntityType, setIsFromDifferentEntityType] = useState(false);
  const tag = assignment.tag;

  useEffect(() => {
    // Check if tag is from a different entity type
    const checkEntityType = async () => {
      if (tag && currentEntityType) {
        const entityTypes = await getTagEntityTypes(tag.id);
        setIsFromDifferentEntityType(
          entityTypes.length > 0 && !entityTypes.includes(currentEntityType)
        );
      }
    };
    
    checkEntityType();
  }, [tag, currentEntityType]);

  if (!tag) return null;

  return (
    <TagBadge
      name={tag.name}
      isRemovable={!!onRemove}
      onRemove={onRemove ? () => onRemove(assignment.id) : undefined}
      entityType={assignment.target_type}
      isFromDifferentEntityType={isFromDifferentEntityType}
      hideEntityType={hideEntityType}
    />
  );
};

export default TagList;
