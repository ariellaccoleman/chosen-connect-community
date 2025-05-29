
import React, { useEffect } from "react";
import { useEntityTags, useTagAssignmentMutations } from "@/hooks/tags/useTagFactoryHooks";
import TagList from "./TagList";
import { Skeleton } from "@/components/ui/skeleton";
import TagSelector from "./TagSelector";
import { EntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";
import { toast } from "sonner";

interface EntityTagManagerProps {
  entityId: string;
  entityType: EntityType;
  isAdmin?: boolean;
  isEditing?: boolean;
  onFinishEditing?: () => void;
  onTagSuccess?: () => void;
  onTagError?: (error: Error) => void;
  className?: string;
}

const EntityTagManager = ({
  entityId,
  entityType,
  isAdmin = false,
  isEditing = false,
  onFinishEditing,
  onTagSuccess,
  onTagError,
  className = ""
}: EntityTagManagerProps) => {
  const { data: tagAssignmentsResponse, isLoading, isError, error, refetch } = useEntityTags(entityId, entityType);
  const { assignTag, removeTagAssignment, isAssigning, isRemoving } = useTagAssignmentMutations();
  
  // Extract the actual assignments from the API response
  const tagAssignments = tagAssignmentsResponse || [];
  
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

  // If there was an error loading the tags, show an error message with retry option
  if (isError) {
    return (
      <div className="p-4 border border-red-200 rounded-md bg-red-50">
        <p className="text-red-700 mb-2">Failed to load tags: {error instanceof Error ? error.message : 'Unknown error'}</p>
        <button 
          className="text-red-700 underline" 
          onClick={() => refetch()}
        >
          Retry
        </button>
      </div>
    );
  }
  
  const handleAddTag = async (tag) => {
    if (!tag || !tag.id) {
      toast.error("Invalid tag selected");
      return;
    }

    logger.info("Assigning tag to entity:", { tagId: tag.id, entityId, entityType });
    
    try {
      await assignTag({ 
        tagId: tag.id, 
        entityId, 
        entityType 
      });
      
      // Call success callback if provided
      if (onTagSuccess) {
        onTagSuccess();
      }
    } catch (error) {
      logger.error("Error assigning tag:", error);
      
      // Call error callback if provided
      if (onTagError && error instanceof Error) {
        onTagError(error);
      }
    }
  };
  
  const handleRemoveTag = async (assignmentId: string) => {
    try {
      await removeTagAssignment(assignmentId);
      
      // Call success callback if provided
      if (onTagSuccess) {
        onTagSuccess();
      }
    } catch (error) {
      logger.error("Error removing tag:", error);
      
      // Call error callback if provided
      if (onTagError && error instanceof Error) {
        onTagError(error);
      }
    }
  };
  
  if (isLoading) {
    return <Skeleton className="h-12 w-full" />;
  }
  
  return (
    <div className={className}>
      {isEditing ? (
        <div>
          <div className="mb-4">
            <TagSelector
              targetType={entityType}
              onTagSelected={handleAddTag}
              isAdmin={isAdmin}
              entityId={entityId}
            />
            {isAssigning && <p className="text-sm text-muted-foreground mt-1">Adding tag...</p>}
          </div>
          
          <TagList 
            tagAssignments={tagAssignments} 
            onRemove={isAdmin ? handleRemoveTag : undefined}
            isRemoving={isRemoving}
            className="mt-2"
          />
        </div>
      ) : (
        <TagList 
          tagAssignments={tagAssignments} 
          onRemove={isAdmin ? handleRemoveTag : undefined}
          isRemoving={isRemoving}
          className={className}
        />
      )}
    </div>
  );
};

export default EntityTagManager;
