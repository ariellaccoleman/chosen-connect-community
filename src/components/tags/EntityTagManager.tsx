
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";
import { Tag, TagAssignment, assignTag, fetchEntityTags, removeTagAssignment } from "@/utils/tagUtils";
import TagList from "./TagList";
import TagSelector from "./TagSelector";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EntityTagManagerProps {
  entityId: string;
  entityType: "person" | "organization";
  isAdmin?: boolean;
  className?: string;
}

const EntityTagManager = ({ 
  entityId, 
  entityType, 
  isAdmin = false,
  className
}: EntityTagManagerProps) => {
  const [tagAssignments, setTagAssignments] = useState<TagAssignment[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  // Fetch existing tags for this entity
  const fetchTags = async () => {
    setIsLoading(true);
    const assignments = await fetchEntityTags(
      entityId, 
      entityType === "person" ? "profile" : "organization"
    );
    setTagAssignments(assignments);
    setIsLoading(false);
  };
  
  useEffect(() => {
    if (entityId) {
      fetchTags();
    }
  }, [entityId, entityType]);
  
  // Handle adding a new tag
  const handleTagSelected = async (tag: Tag) => {
    if (!user?.id || !entityId) {
      toast.error("You must be logged in to add tags");
      return;
    }
    
    const result = await assignTag(
      tag.id, 
      entityId, 
      entityType === "person" ? "profile" : "organization"
    );
    
    if (result) {
      toast.success(`Tag "${tag.name}" added successfully`);
      fetchTags(); // Refresh tag assignments
      setIsAdding(false);
    }
  };
  
  // Handle removing a tag
  const handleRemoveTag = async (assignmentId: string) => {
    const success = await removeTagAssignment(assignmentId);
    
    if (success) {
      toast.success("Tag removed successfully");
      setTagAssignments(prev => prev.filter(assignment => assignment.id !== assignmentId));
    }
  };
  
  // Check if user can manage tags
  const canManageTags = isAdmin || user?.id === entityId;
  
  if (isLoading) {
    return <div className="py-2">Loading tags...</div>;
  }
  
  return (
    <div className={`space-y-4 ${className || ""}`}>
      <TagList 
        tagAssignments={tagAssignments} 
        onRemove={canManageTags ? handleRemoveTag : undefined}
      />
      
      {canManageTags && (
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="mt-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Tag
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default EntityTagManager;
