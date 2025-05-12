
import React, { useState, useEffect } from "react";
import { useEntityTags, useTagAssignmentMutations, useTags } from "@/hooks/useTags";
import { Tag, TagAssignment } from "@/utils/tagUtils";
import TagList from "./TagList";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
  onFinishEditing,
  showEntityType = false
}: EntityTagManagerProps) => {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: tagAssignments, isLoading } = useEntityTags(entityId, entityType);
  const { assignTag, removeTagAssignment, isAssigning, isRemoving } = useTagAssignmentMutations();
  const { data: allTags, isLoading: isTagsLoading } = useTags({ targetType: entityType });
  
  useEffect(() => {
    if (allTags && tagAssignments) {
      // Filter out already assigned tags from allTags
      const assignedTagIds = tagAssignments.map(assignment => assignment.tag_id);
      const unassignedTags = allTags.filter(tag => !assignedTagIds.includes(tag.id));
      setAvailableTags(unassignedTags);
    }
  }, [allTags, tagAssignments]);
  
  const handleAddTag = async (tagId: string) => {
    try {
      await assignTag({ tagId, entityId, entityType });
      // Optimistically update availableTags by removing the assigned tag
      setAvailableTags(prevTags => prevTags.filter(tag => tag.id !== tagId));
    } catch (error) {
      console.error("Error assigning tag:", error);
    }
  };
  
  const handleRemoveTag = async (assignmentId: string) => {
    try {
      await removeTagAssignment(assignmentId);
      // Optimistically update availableTags by adding the removed tag back
      const removedAssignment = tagAssignments?.find(assignment => assignment.id === assignmentId);
      if (removedAssignment?.tag) {
        setAvailableTags(prevTags => [...prevTags, removedAssignment.tag].sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (error) {
      console.error("Error removing tag:", error);
    }
  };
  
  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div>
      {isEditing ? (
        <div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="mb-4 w-full flex items-center justify-between">
                Add Tag
                <PlusCircle className="w-4 h-4 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[200px]">
              <Command>
                <CommandInput
                  placeholder="Search tags..."
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList>
                  <CommandEmpty>No tags found.</CommandEmpty>
                  <CommandGroup heading="Tags">
                    {isTagsLoading ? (
                      <CommandItem className="justify-center">
                        <Skeleton className="h-4 w-[80px]" />
                      </CommandItem>
                    ) : (
                      filteredTags.map((tag) => (
                        <CommandItem
                          key={tag.id}
                          onSelect={() => {
                            handleAddTag(tag.id);
                          }}
                          className="flex items-center justify-between"
                        >
                          {tag.name}
                          {isAssigning ? (
                            <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                          ) : (
                            <PlusCircle className="h-4 w-4 ml-2 text-gray-500" />
                          )}
                        </CommandItem>
                      ))
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <TagList 
            tagAssignments={tagAssignments} 
            onRemove={isAdmin ? handleRemoveTag : undefined}
            currentEntityType={entityType}
            className="mb-4"
            showEntityType={showEntityType}
          />
          <Button variant="secondary" onClick={onFinishEditing}>
            Done Editing
          </Button>
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
