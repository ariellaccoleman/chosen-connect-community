
import React from 'react';
import { TagAssignment } from '@/utils/tags';
import TagBadge from './TagBadge';
import { cn } from "@/lib/utils";

interface TagListProps {
  tagAssignments: TagAssignment[];
  onRemove?: (assignmentId: string) => void;
  currentEntityType?: string;
  isRemoving?: boolean;
  className?: string; // Add className prop
}

const TagList = ({ 
  tagAssignments, 
  onRemove, 
  currentEntityType,
  isRemoving = false,
  className
}: TagListProps) => {
  if (!tagAssignments || tagAssignments.length === 0) {
    return <p className="text-gray-500 text-sm">No tags assigned.</p>;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tagAssignments.map((assignment) => (
        assignment.tag && (
          <TagBadge
            key={assignment.id}
            name={assignment.tag.name}
            entityType={assignment.tag.type || undefined}
            isRemovable={!!onRemove}
            onRemove={onRemove ? () => onRemove(assignment.id) : undefined}
            isFromDifferentEntityType={currentEntityType ? assignment.tag.type !== currentEntityType : false}
            isRemoving={isRemoving}
          />
        )
      ))}
    </div>
  );
};

export default TagList;
