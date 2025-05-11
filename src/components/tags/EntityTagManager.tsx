
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";
import { TagAssignment } from "@/utils/tagUtils";
import { useEntityTags, useTagAssignmentMutations } from "@/hooks/useTags";
import TagList from "./TagList";
import TagSelector from "./TagSelector";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface EntityTagManagerProps {
  entityId: string;
  entityType: "person" | "organization";
  isAdmin?: boolean;
  className?: string;
  isEditing?: boolean;
  onFinishEditing?: () => void;
}

const EntityTagManager = ({ 
  entityId, 
  entityType, 
  isAdmin = false,
  className,
  isEditing = false,
  onFinishEditing
}: EntityTagManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const { user } = useAuth();
  const { data: tagAssignments = [], isLoading } = useEntityTags(entityId, entityType);
  const { assignTag, removeTagAssignment, isAssigning, isRemoving } = useTagAssignmentMutations();
  
  // Check if user can manage tags
  const canManageTags = isAdmin || (entityType === "person" && user?.id === entityId);
  
  // Reset adding state when editing mode changes
  useEffect(() => {
    if (!isEditing) {
      setIsAdding(false);
    }
  }, [isEditing]);

  // Handle adding a new tag
  const handleTagSelected = async (tag: any) => {
    if (!user?.id || !entityId) {
      toast.error("You must be logged in to add tags");
      return;
    }
    
    try {
      // Call assignTag and wait for the result
      await assignTag({
        tagId: tag.id, 
        entityId, 
        entityType
      }, {
        onSuccess: () => {
          toast.success(`Tag "${tag.name}" added successfully`);
          setIsAdding(false);
        },
        onError: (error) => {
          console.error("Error assigning tag:", error);
          toast.error("Failed to add tag. Please try again.");
        }
      });
    } catch (error) {
      console.error("Error assigning tag:", error);
      toast.error("Failed to add tag. Please try again.");
    }
  };
  
  // Handle removing a tag
  const handleRemoveTag = async (assignmentId: string) => {
    try {
      // Call removeTagAssignment and wait for the result
      await removeTagAssignment(assignmentId, {
        onSuccess: () => {
          toast.success("Tag removed successfully");
        },
        onError: (error) => {
          console.error("Error removing tag:", error);
          toast.error("Failed to remove tag. Please try again.");
        }
      });
    } catch (error) {
      console.error("Error removing tag:", error);
      toast.error("Failed to remove tag. Please try again.");
    }
  };
  
  if (isLoading) {
    return <div className="py-2">Loading tags...</div>;
  }
  
  return (
    <div className={`space-y-4 ${className || ""}`}>
      <TagList 
        tagAssignments={tagAssignments} 
        onRemove={(isEditing && canManageTags) ? handleRemoveTag : undefined}
        currentEntityType={entityType}
      />
      
      {canManageTags && isEditing && (
        <>
          {isAdding ? (
            <div className="space-y-2">
              <TagSelector 
                targetType={entityType}
                onTagSelected={handleTagSelected}
                isAdmin={isAdmin}
              />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsAdding(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(true)}
                disabled={isAssigning || isRemoving}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Tag
              </Button>
              
              {onFinishEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onFinishEditing}
                >
                  <X className="mr-2 h-4 w-4" />
                  Done
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EntityTagManager;
