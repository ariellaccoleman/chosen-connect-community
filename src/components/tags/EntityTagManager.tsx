
import React from "react";
import { useEntityTags, useTagAssignmentMutations } from "@/hooks/useTags";
import TagList from "./TagList";
import { Skeleton } from "@/components/ui/skeleton";
import TagSelector from "./TagSelector";
import { EntityType, isValidEntityType } from "@/types/entityTypes";

interface EntityTagManagerProps {
  entityId: string;
  entityType: EntityType | string;
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
  // Convert string entityType to EntityType enum if needed
  const validatedEntityType = isValidEntityType(entityType) 
    ? entityType 
    : (entityType === "person" ? EntityType.PERSON : 
       entityType === "organization" ? EntityType.ORGANIZATION : 
       entityType === "event" ? EntityType.EVENT : EntityType.PERSON);
  
  const { data: tagAssignments, isLoading } = useEntityTags(entityId, validatedEntityType);
  const { assignTag, removeTagAssignment } = useTagAssignmentMutations();
  
  const handleAddTag = async (tag) => {
    try {
      await assignTag({ 
        tagId: tag.id, 
        entityId, 
        entityType: validatedEntityType 
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
              targetType={validatedEntityType}
              onTagSelected={handleAddTag}
              isAdmin={isAdmin}
            />
          </div>
          
          <TagList 
            tagAssignments={tagAssignments} 
            onRemove={isAdmin ? handleRemoveTag : undefined}
            currentEntityType={validatedEntityType}
          />
        </div>
      ) : (
        <TagList 
          tagAssignments={tagAssignments} 
          onRemove={isAdmin ? handleRemoveTag : undefined}
          currentEntityType={validatedEntityType}
        />
      )}
    </div>
  );
};

export default EntityTagManager;
