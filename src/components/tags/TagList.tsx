
import React from 'react';
import { TagAssignment } from '@/utils/tags';
import TagBadge from './TagBadge';

interface TagListProps {
  tagAssignments: TagAssignment[];
  onRemove?: (assignmentId: string) => void;
  currentEntityType?: string;
  isRemoving?: boolean;
}

const TagList = ({ 
  tagAssignments, 
  onRemove, 
  currentEntityType,
  isRemoving = false
}: TagListProps) => {
  if (!tagAssignments || tagAssignments.length === 0) {
    return <p className="text-gray-500 text-sm">No tags assigned.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tagAssignments.map((assignment) => (
        assignment.tag && (
          <TagBadge
            key={assignment.id}
            tag={assignment.tag}
            onRemove={onRemove ? () => onRemove(assignment.id) : undefined}
            isRemoving={isRemoving}
          />
        )
      ))}
    </div>
  );
};

export default TagList;
