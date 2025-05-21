
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useEntityTags } from '@/hooks/tags/useTagHooks';
import { EntityType } from '@/types/entityTypes';

export interface TagListProps {
  tagIds?: string[];
  tagAssignments?: any[];
  limit?: number;
  className?: string;
  currentEntityType?: EntityType;
  onRemove?: (assignmentId: string) => Promise<void>;
  isRemoving?: boolean;
}

/**
 * Renders a list of tags as badges
 * Can accept either tag IDs or tag assignment objects
 */
const TagList = ({ 
  tagIds = [], 
  tagAssignments = [], 
  limit = 3,
  className = '',
  currentEntityType,
  onRemove,
  isRemoving = false
}: TagListProps) => {
  // Handle both tag IDs and tag assignment objects
  const ids = tagIds.length > 0 
    ? tagIds 
    : (tagAssignments || []).map(assignment => 
        typeof assignment === 'string' ? assignment : assignment.tag_id
      );

  // Fetch tag data based on IDs
  const { data: tagsData, isLoading } = useEntityTags(ids.length > 0 ? ids.join(',') : '', currentEntityType);
  
  // Ensure tags is always an array
  const tags = Array.isArray(tagsData) 
    ? tagsData 
    : (tagsData && typeof tagsData === 'object' && 'data' in tagsData 
        ? tagsData.data || [] 
        : []);

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
  const displayTags = tags.slice?.(0, limit) || [];
  const remainingCount = (tags.length || 0) - limit;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {displayTags.map(tag => (
        <Badge key={tag.id} variant="outline">
          {tag.name}
          {onRemove && (
            <button
              onClick={() => onRemove(tag.id)}
              className="ml-1 hover:text-destructive"
              disabled={isRemoving}
            >
              ×
            </button>
          )}
        </Badge>
      ))}
      
      {remainingCount > 0 && (
        <Badge variant="outline">
          +{remainingCount} more
        </Badge>
      )}
      
      {(tags.length === 0 || !tags.length) && (
        <span className="text-sm text-muted-foreground">No tags</span>
      )}
    </div>
  );
};

export default TagList;
