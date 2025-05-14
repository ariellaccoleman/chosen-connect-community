
import React from "react";
import { useEntityTags, useTagAssignmentMutations } from "@/hooks/useTags";
import TagList from "./TagList";
import { Skeleton } from "@/components/ui/skeleton";
import TagSelector from "./TagSelector";
import { EntityType, isValidEntityType } from "@/types/entityTypes";

interface EntityTagManagerProps {
  entityId: string;
  entityType: EntityType;
  isAdmin?: boolean;
  isEditing?: boolean;
  onFinishEditing?: () => void;
}

const EntityTagManager = ({
  entityId,
  entityType,
  isAdmin = false,
  isEditing = false,
  onFinishEditing
}: EntityTagManagerProps) => {
  const { data: tagAssignmentsResponse, isLoading } = useEntityTags(entityId, entityType);
  const { assignTag, removeTagAssignment } = useTagAssignmentMutations();
  
  // Extract the actual assignments from the API response
  const tagAssignments = tagAssignmentsResponse?.data || [];
  
  const handleAddTag = async (tag) => {
    try {
      await assignTag({ 
        tagId: tag.id, 
        entityId, 
        entityType 
      });
    } catch (error) {
      console.error("Error assigning tag:", error);
    }
  };
  
  const handleRemoveTag = async (assignmentId: string) => {
    try {
      await removeTagAssignment(assignmentId);
    } catch (error) {
      console.error("Error removing tag:", error);
    }
  };
  
  if (isLoading) {
    return <Skeleton className="h-12 w-full" />;
  }
  
  return (
    <div>
      {isEditing ? (
        <div>
          <div className="mb-4">
            <TagSelector
              targetType={entityType}
              onTagSelected={handleAddTag}
              isAdmin={isAdmin}
            />
          </div>
          
          <TagList 
            tagAssignments={tagAssignments} 
            onRemove={isAdmin ? handleRemoveTag : undefined}
            currentEntityType={entityType}
          />
        </div>
      ) : (
        <TagList 
          tagAssignments={tagAssignments} 
          onRemove={isAdmin ? handleRemoveTag : undefined}
          currentEntityType={entityType}
        />
      )}
    </div>
  );
};

export default EntityTagManager;
