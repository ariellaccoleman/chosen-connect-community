
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useEntityTags } from '@/hooks/tags';

interface TagListProps {
  tagIds?: string[];
  tagAssignments?: any[];
  limit?: number;
  className?: string;
}

/**
 * Renders a list of tags as badges
 * Can accept either tag IDs or tag assignment objects
 */
const TagList = ({ 
  tagIds = [], 
  tagAssignments = [], 
  limit = 3,
  className = ''
}: TagListProps) => {
  // Handle both tag IDs and tag assignment objects
  const ids = tagIds.length > 0 
    ? tagIds 
    : (tagAssignments || []).map(assignment => 
        typeof assignment === 'string' ? assignment : assignment.tag_id
      );

  // Fetch tag data based on IDs
  const { data: tags = [], isLoading } = useEntityTags(ids);

  if (isLoading) {
    return (
      <div className={`flex gap-2 ${className}`}>
        {[...Array(Math.min(limit, 3))].map((_, i) => (
          <Badge key={i} variant="outline" className="animate-pulse h-6 w-16" />
        ))}
      </div>
    );
  }

  // Limit the number of tags shown
  const displayTags = tags.slice(0, limit);
  const remainingCount = tags.length - limit;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {displayTags.map(tag => (
        <Badge key={tag.id} variant="outline">
          {tag.name}
        </Badge>
      ))}
      
      {remainingCount > 0 && (
        <Badge variant="outline">
          +{remainingCount} more
        </Badge>
      )}
      
      {tags.length === 0 && (
        <span className="text-sm text-muted-foreground">No tags</span>
      )}
    </div>
  );
};

export default TagList;
