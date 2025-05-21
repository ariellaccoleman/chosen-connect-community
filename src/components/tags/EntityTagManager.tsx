import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/useDebounce';
import { useAvailableTags } from '@/hooks/tags';
import { Tag } from '@/types/tag';
import { EntityType } from '@/types/entityTypes';
import TagList from './TagList';
import { toast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';

interface EntityTagManagerProps {
  entityId: string;
  currentEntityType: EntityType;
  existingTagAssignments: any[];
  onTagAssignment: (tagId: string) => Promise<void>;
  onTagUnassignment: (assignmentId: string) => Promise<void>;
}

/**
 * Manages tags for a specific entity
 */
const EntityTagManager: React.FC<EntityTagManagerProps> = ({
  entityId,
  currentEntityType,
  existingTagAssignments,
  onTagAssignment,
  onTagUnassignment,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const debouncedInputValue = useDebounce(inputValue, 300);
  
  // Fetch available tags based on the debounced input value
  const { data: availableTags = [], isLoading: isTagsLoading } = useAvailableTags(
    debouncedInputValue,
    currentEntityType
  );
  
  // Handler to add a tag to the entity
  const handleAddTag = useCallback(async (tag: Tag) => {
    setIsAdding(true);
    try {
      await onTagAssignment(tag.id);
      setInputValue('');
    } catch (error) {
      logger.error('Error assigning tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign tag',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  }, [onTagAssignment]);
  
  // Handler to remove a tag from the entity
  const handleRemove = useCallback(async (assignmentId: string) => {
    setIsRemoving(true);
    try {
      await onTagUnassignment(assignmentId);
    } catch (error) {
      logger.error('Error unassigning tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to unassign tag',
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(false);
    }
  }, [onTagUnassignment]);
  
  // Filter out tags that are already assigned to the entity
  const tagAssignments = existingTagAssignments || [];
  const assignedTagIds = tagAssignments.map(assignment => assignment.tag_id);
  const unassignedTags = availableTags.filter(tag => !assignedTagIds.includes(tag.id));

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="tag-input">Add Tags</Label>
        <div className="flex items-center space-x-2 mt-2">
          <Input
            id="tag-input"
            type="text"
            placeholder="Search for tags..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isAdding}
          />
          {unassignedTags.length > 0 && (
            <Button
              type="button"
              onClick={() => handleAddTag(unassignedTags[0])}
              disabled={isAdding || isTagsLoading}
            >
              {isAdding || isTagsLoading ? 'Adding...' : 'Add Tag'}
            </Button>
          )}
        </div>
      </div>
      
      <div>
        <Label>Current Tags</Label>
        <TagList 
          tagAssignments={tagAssignments} 
          isRemoving={isRemoving}
          onRemove={handleRemove}
        />
      </div>
    </div>
  );
};

export default EntityTagManager;
