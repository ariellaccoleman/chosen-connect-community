
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TagAssignment } from '@/utils/tags';
import { logger } from '@/utils/logger';
import { EntityType } from '@/types/entityTypes';

interface TagListProps {
  tagAssignments?: TagAssignment[] | null;
  className?: string;
  max?: number;
  showMore?: boolean;
  onRemove?: (assignmentId: string) => void;
  isRemoving?: boolean;
}

const TagList: React.FC<TagListProps> = ({ 
  tagAssignments = [], 
  className = '', 
  max, 
  showMore = false,
  onRemove,
  isRemoving = false
}) => {
  // Safety check for null or undefined
  if (!tagAssignments || tagAssignments.length === 0) {
    return null;
  }

  // Debug the tag assignments structure
  React.useEffect(() => {
    logger.debug(`TagList: Received ${tagAssignments.length} tag assignments`, 
      tagAssignments.map(t => ({
        id: t.id,
        tag_id: t.tag_id,
        tag: t.tag ? { id: t.tag.id, name: t.tag.name } : 'undefined'
      }))
    );
  }, [tagAssignments]);

  // Limit the number of tags to display if max is specified
  const displayedTags = max ? tagAssignments.slice(0, max) : tagAssignments;
  const hiddenCount = max && tagAssignments.length > max ? tagAssignments.length - max : 0;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {displayedTags.map((assignment) => {
        // Handle both tag access patterns (nested tag object or direct properties)
        const tagName = assignment.tag ? assignment.tag.name : undefined;
        
        // Skip if we don't have a tag name
        if (!tagName) {
          logger.debug(`TagList: Missing tag name for assignment:`, assignment);
          return null;
        }
        
        return (
          <Badge 
            key={assignment.id || assignment.tag_id} 
            variant="secondary"
            className="text-xs py-1 px-2 inline-flex items-center"
          >
            {tagName}
            {onRemove && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove(assignment.id);
                }}
                disabled={isRemoving}
                className="ml-1 hover:text-red-500"
                aria-label="Remove tag"
              >
                ×
              </button>
            )}
          </Badge>
        );
      })}
      
      {showMore && hiddenCount > 0 && (
        <Badge 
          variant="outline"
          className="text-xs py-1 cursor-default"
        >
          +{hiddenCount} more
        </Badge>
      )}
    </div>
  );
};

export default TagList;
