
import React, { useEffect, useState } from "react";
import { useEntityTags } from "@/hooks/useTagQueries";
import { useTagAssignmentMutations } from "@/hooks/tag";
import { Tag } from "@/utils/tags";
import TagList from "./TagList";
import TagSelector from "./TagSelector";
import { EntityType } from "@/types/entityTypes";
import { TagAssignment } from "@/utils/tags/types";

interface EntityTagManagerProps {
  entityId: string;
  entityType: EntityType;
  isAdmin?: boolean;
  isEditing?: boolean;
}

/**
 * Component for managing tags assigned to an entity
 * This is the main component used for viewing and editing tags
 */
const EntityTagManager = ({
  entityId, 
  entityType,
  isAdmin = false,
  isEditing = false
}: EntityTagManagerProps) => {
  const { 
    data: tagAssignments = [], 
    isLoading,
    refetch: refetchTags
  } = useEntityTags(entityId, entityType);
  
  const { assignTag, removeTag } = useTagAssignmentMutations();
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  // Callback for selecting a tag from the dropdown
  const handleTagSelected = async (tag: Tag) => {
    if (!tag?.id) return;
    
    try {
      await assignTag(entityId, entityType, tag.id);
      setSelectedTagId(null);
      refetchTags();
    } catch (error) {
      console.error("Error assigning tag:", error);
    }
  };

  // Callback for removing a tag from the entity
  const handleRemoveTag = async (assignment: TagAssignment) => {
    if (!assignment?.id) return;
    
    try {
      await removeTag(assignment.id);
      refetchTags();
    } catch (error) {
      console.error("Error removing tag:", error);
    }
  };

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="mb-4">
          <TagSelector
            targetType={entityType}
            onTagSelected={handleTagSelected}
            isAdmin={isAdmin}
            currentSelectedTagId={selectedTagId}
          />
        </div>
      )}
      
      <TagList 
        tagAssignments={tagAssignments} 
        currentEntityType={entityType}
        isEditing={isEditing}
        onRemoveTag={isEditing ? handleRemoveTag : undefined}
      />
    </div>
  );
};

export default EntityTagManager;
