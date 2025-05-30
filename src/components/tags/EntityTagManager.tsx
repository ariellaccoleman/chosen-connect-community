import React, { useEffect } from "react";
import { useEntityTags, useTagAssignmentMutations } from "@/hooks/tags/useTagFactoryHooks";
import TagList from "./TagList";
import EntityTagDisplay from "./EntityTagDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import TagSelector from "./TagSelector";
import { EntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ApiOperations } from "@/api/core/types";

// Define the API factories interface for dependency injection
interface ApiFactories {
  eventApi?: ApiOperations<any>;
  tagApi?: ApiOperations<any>;
  tagAssignmentApi?: ApiOperations<any>;
}

interface EntityTagManagerProps {
  entityId: string;
  entityType: EntityType;
  isAdmin?: boolean;
  isEditing?: boolean;
  onFinishEditing?: () => void;
  onTagSuccess?: () => void;
  onTagError?: (error: Error) => void;
  className?: string;
  // Optional API factories for testing/custom usage
  apiFactories?: ApiFactories;
}

const EntityTagManager = ({
  entityId,
  entityType,
  isAdmin = false,
  isEditing = false,
  onFinishEditing,
  onTagSuccess,
  onTagError,
  className = "",
  apiFactories
}: EntityTagManagerProps) => {
  const queryClient = useQueryClient();
  
  // Use injected API factories or default hooks
  const { data: tagAssignmentsResponse, isLoading, isError, error, refetch } = useEntityTags(
    entityId, 
    entityType,
    apiFactories?.tagAssignmentApi
  );
  
  const { assignTag, removeTagAssignment, isAssigning, isRemoving } = useTagAssignmentMutations(
    apiFactories?.tagAssignmentApi
  );
  
  // Extract the actual assignments from the API response
  const tagAssignments = tagAssignmentsResponse || [];
  
  // Log component mounting and props for debugging
  useEffect(() => {
    logger.info(`EntityTagManager mounted for ${entityType} ${entityId}`, {
      entityId,
      entityType,
      isAdmin,
      isEditing,
      assignmentsCount: tagAssignments.length,
      hasCustomApis: !!apiFactories
    });
  }, [entityId, entityType, isAdmin, isEditing, tagAssignments.length, apiFactories]);

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
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['entity-tags', entityId, entityType] });
      queryClient.invalidateQueries({ queryKey: ['organization', entityId] });
      queryClient.invalidateQueries({ queryKey: ['event', entityId] });
      queryClient.invalidateQueries({ queryKey: ['profile', entityId] });
      
      // Call success callback if provided
      if (onTagSuccess) {
        onTagSuccess();
      }
      
      toast.success("Tag added successfully");
    } catch (error) {
      logger.error("Error assigning tag:", error);
      
      // Call error callback if provided
      if (onTagError && error instanceof Error) {
        onTagError(error);
      }
      
      toast.error("Failed to add tag");
    }
  };
  
  const handleRemoveTag = async (assignmentId: string) => {
    try {
      await removeTagAssignment(assignmentId);
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['entity-tags', entityId, entityType] });
      queryClient.invalidateQueries({ queryKey: ['organization', entityId] });
      queryClient.invalidateQueries({ queryKey: ['event', entityId] });
      queryClient.invalidateQueries({ queryKey: ['profile', entityId] });
      
      // Call success callback if provided
      if (onTagSuccess) {
        onTagSuccess();
      }
      
      toast.success("Tag removed successfully");
    } catch (error) {
      logger.error("Error removing tag:", error);
      
      // Call error callback if provided
      if (onTagError && error instanceof Error) {
        onTagError(error);
      }
      
      toast.error("Failed to remove tag");
    }
  };
  
  if (isLoading) {
    return <Skeleton className="h-12 w-full" />;
  }

  // DISPLAY MODE: Just show tag pills like on entity cards
  if (!isEditing) {
    return (
      <EntityTagDisplay 
        entityId={entityId}
        entityType={entityType}
        className={className}
      />
    );
  }

  // EDITING MODE: Show tag selector + removable tag list
  return (
    <div className={className}>
      <div className="mb-4">
        <TagSelector
          targetType={entityType}
          onTagSelected={handleAddTag}
          isAdmin={isAdmin}
          entityId={entityId}
          tagApi={apiFactories?.tagApi}
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
  );
};

export default EntityTagManager;
