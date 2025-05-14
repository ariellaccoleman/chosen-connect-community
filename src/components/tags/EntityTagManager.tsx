
import React, { useEffect } from "react";
import { useEntityTags, useTagAssignmentMutations } from "@/hooks/useTags";
import TagList from "./TagList";
import { Skeleton } from "@/components/ui/skeleton";
import TagSelector from "./TagSelector";
import { EntityType, isValidEntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";
import { toast } from "sonner";

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
  const { assignTag, removeTagAssignment, isAssigning, isRemoving } = useTagAssignmentMutations();
  
  // Extract the actual assignments from the API response
  const tagAssignments = tagAssignmentsResponse?.data || [];
  
  // Log component mounting and props for debugging
  useEffect(() => {
    logger.info(`EntityTagManager mounted for ${entityType} ${entityId}`, {
      entityId,
      entityType,
      isAdmin,
      isEditing,
      assignmentsCount: tagAssignments.length
    });
  }, [entityId, entityType, isAdmin, isEditing, tagAssignments.length]);
  
  const handleAddTag = async (tag) => {
    logger.info("Assigning tag to entity:", { tagId: tag.id, entityId, entityType });
    console.log("Assigning tag to entity:", { tagId: tag.id, entityId, entityType });
    
    try {
      await assignTag({ 
        tagId: tag.id, 
        entityId, 
        entityType 
      });
      toast.success(`Added tag: ${tag.name}`);
    } catch (error) {
      logger.error("Error assigning tag:", error);
      console.error("Error assigning tag:", error);
      toast.error("Failed to add tag. Please try again.");
    }
  };
  
  const handleRemoveTag = async (assignmentId: string) => {
    try {
      await removeTagAssignment(assignmentId);
      toast.success("Tag removed successfully");
    } catch (error) {
      logger.error("Error removing tag:", error);
      console.error("Error removing tag:", error);
      toast.error("Failed to remove tag. Please try again.");
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
            {isAssigning && <p className="text-sm text-muted-foreground mt-1">Adding tag...</p>}
          </div>
          
          <TagList 
            tagAssignments={tagAssignments} 
            onRemove={isAdmin ? handleRemoveTag : undefined}
            currentEntityType={entityType}
            isRemoving={isRemoving}
          />
        </div>
      ) : (
        <TagList 
          tagAssignments={tagAssignments} 
          onRemove={isAdmin ? handleRemoveTag : undefined}
          currentEntityType={entityType}
          isRemoving={isRemoving}
        />
      )}
    </div>
  );
};

export default EntityTagManager;
