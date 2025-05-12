
import React from "react";
import { useEntityTags, useTagAssignmentMutations } from "@/hooks/useTags";
import TagList from "./TagList";
import { Skeleton } from "@/components/ui/skeleton";
import TagSelector from "./TagSelector";

interface EntityTagManagerProps {
  entityId: string;
  entityType: "person" | "organization";
  isAdmin?: boolean;
  isEditing?: boolean;
  onFinishEditing?: () => void;
  showEntityType?: boolean;
}

const EntityTagManager = ({
  entityId,
  entityType,
  isAdmin = false,
  isEditing = false,
  showEntityType = false
}: EntityTagManagerProps) => {
  const { data: tagAssignments, isLoading } = useEntityTags(entityId, entityType);
  const { assignTag, removeTagAssignment } = useTagAssignmentMutations();
  
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
            showEntityType={showEntityType}
          />
        </div>
      ) : (
        <TagList 
          tagAssignments={tagAssignments} 
          onRemove={isAdmin ? handleRemoveTag : undefined}
          currentEntityType={entityType}
          showEntityType={showEntityType}
        />
      )}
    </div>
  );
};

export default EntityTagManager;
