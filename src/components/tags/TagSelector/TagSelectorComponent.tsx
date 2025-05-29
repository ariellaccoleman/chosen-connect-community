
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tag } from "@/utils/tags";
import TagSearch from "./TagSearch";
import CreateTagDialog from "./CreateTagDialog";
import { EntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";
import { toast } from "sonner";
import { useSelectionTags, useTagCrudMutations } from "@/hooks/tags/useTagFactoryHooks";

interface TagSelectorComponentProps {
  targetType: EntityType;
  onTagSelected: (tag: Tag) => void;
  isAdmin?: boolean;
  currentSelectedTagId?: string | null;
  entityId?: string; // Add entityId prop
}

/**
 * Component for selecting and creating tags
 */
const TagSelectorComponent = ({ 
  targetType, 
  onTagSelected, 
  isAdmin = false,
  currentSelectedTagId,
  entityId
}: TagSelectorComponentProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const { user } = useAuth();

  // Use factory-based hooks instead of direct API calls
  const { data: tagsResponse, isLoading, refetch } = useSelectionTags(targetType);
  const { createTag, isCreating } = useTagCrudMutations();

  // Extract tags from the API response - handle both array and ApiResponse formats
  const tags = Array.isArray(tagsResponse) ? tagsResponse : (tagsResponse?.data || []);

  // Find and set the selected tag when currentSelectedTagId changes
  useEffect(() => {
    if (currentSelectedTagId && tags.length > 0) {
      const foundTag = tags.find(tag => tag.id === currentSelectedTagId);
      if (foundTag) {
        setSelectedTag(foundTag);
      }
    } else {
      setSelectedTag(null);
    }
  }, [currentSelectedTagId, tags]);

  // Filter tags based on search value
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  /**
   * Open tag creation dialog
   */
  const handleOpenCreateDialog = () => {
    if (!user?.id) {
      return;
    }
    
    setIsCreateDialogOpen(true);
    setOpen(false);
  };

  /**
   * Handle tag creation success
   */
  const handleTagCreated = (tag: Tag) => {
    setSelectedTag(tag);
    // Call the parent's onTagSelected callback
    onTagSelected(tag);
    
    // Reload tags to include the new one
    refetch();
  };

  /**
   * Handle tag selection
   */
  const handleTagSelection = (tag: Tag) => {
    setSelectedTag(tag);
    // Important: Call the parent's onTagSelected callback to assign the tag
    onTagSelected(tag);
    setSearchValue("");
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedTag ? (
              <span className="flex items-center">
                <TagIcon className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{selectedTag.name}</span>
              </span>
            ) : (
              <span className="flex items-center">
                <TagIcon className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">Select a tag</span>
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px]">
          <TagSearch 
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            tags={filteredTags}
            targetType={targetType}
            onTagSelected={handleTagSelection}
            handleOpenCreateDialog={handleOpenCreateDialog}
            user={user}
            isLoading={isLoading}
            entityId={entityId}
          />
        </PopoverContent>
      </Popover>

      <CreateTagDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        initialValue={searchValue}
        targetType={targetType}
        onTagCreated={handleTagCreated}
        isAdmin={isAdmin}
        entityId={entityId}
      />
    </>
  );
};

export default TagSelectorComponent;
