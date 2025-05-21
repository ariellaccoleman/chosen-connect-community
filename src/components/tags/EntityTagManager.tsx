
import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/useDebounce';
import { useAvailableTags } from '@/hooks/tags/useTagHooks';
import { Tag } from '@/types/tag';
import { EntityType } from '@/types/entityTypes';
import TagList from './TagList';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface EntityTagManagerProps {
  entityId: string;
  entityType: EntityType;
  existingTagAssignments?: any[];
  onTagAssignment?: (tagId: string) => Promise<void>;
  onTagUnassignment?: (assignmentId: string) => Promise<void>;
  isAdmin?: boolean;
  isEditing?: boolean;
  onTagSuccess?: () => void;
  onTagError?: (error: Error) => void;
}

/**
 * Manages tags for a specific entity
 */
const EntityTagManager: React.FC<EntityTagManagerProps> = ({
  entityId,
  entityType,
  existingTagAssignments = [],
  onTagAssignment,
  onTagUnassignment,
  isAdmin,
  isEditing,
  onTagSuccess,
  onTagError,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const debouncedInputValue = useDebounce(inputValue, 300);
  
  // Fetch available tags based on the debounced input value
  const { data: availableTags = [], isLoading: isTagsLoading } = useAvailableTags(
    debouncedInputValue,
    entityType
  );
  
  // Handler to add a tag to the entity
  const handleAddTag = useCallback(async (tag: Tag) => {
    if (!onTagAssignment) return;
    
    setIsAdding(true);
    try {
      await onTagAssignment(tag.id);
      setInputValue('');
      toast.success(`Tag "${tag.name}" assigned successfully`);
      if (onTagSuccess) onTagSuccess();
    } catch (error) {
      logger.error('Error assigning tag:', error);
      toast.error('Failed to assign tag');
      if (onTagError && error instanceof Error) onTagError(error);
    } finally {
      setIsAdding(false);
    }
  }, [onTagAssignment, onTagSuccess, onTagError]);
  
  // Handler to remove a tag from the entity
  const handleRemove = useCallback(async (assignmentId: string) => {
    if (!onTagUnassignment) return;
    
    setIsRemoving(true);
    try {
      await onTagUnassignment(assignmentId);
      toast.success("Tag removed successfully");
    } catch (error) {
      logger.error('Error unassigning tag:', error);
      toast.error('Failed to unassign tag');
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
          currentEntityType={entityType}
          isRemoving={isRemoving}
          onRemove={handleRemove}
        />
      </div>
    </div>
  );
};

export default EntityTagManager;
