
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tag, fetchSelectionTags, invalidateTagCache } from "@/utils/tags";
import TagSearch from "./TagSearch";
import CreateTagDialog from "./CreateTagDialog";
import { EntityType } from "@/types/entityTypes";

interface TagSelectorComponentProps {
  targetType: EntityType;
  onTagSelected: (tag: Tag) => void;
  isAdmin?: boolean;
}

const TagSelectorComponent = ({ 
  targetType, 
  onTagSelected, 
  isAdmin = false 
}: TagSelectorComponentProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user } = useAuth();

  // Load tags based on search criteria - using fetchSelectionTags for typeahead behavior
  useEffect(() => {
    const loadTags = async () => {
      // On first load or when opening popover, try to invalidate cache
      if (searchValue === "" && open) {
        try {
          // Try to refresh the cache
          await invalidateTagCache(targetType);
        } catch (err) {
          console.error("Failed to invalidate tag cache:", err);
        }
      }

      try {
        const fetchedTags = await fetchSelectionTags({ 
          searchQuery: searchValue,
          targetType,
          skipCache: searchValue === "" // Skip cache for initial load
        });
        setTags(fetchedTags);
      } catch (err) {
        console.error("Error fetching tags:", err);
        setTags([]);
      }
    };

    const timeoutId = setTimeout(loadTags, 300);
    return () => clearTimeout(timeoutId);
  }, [searchValue, targetType, isAdmin, user?.id, open]);

  const handleOpenCreateDialog = () => {
    if (!user?.id) {
      return;
    }
    
    setIsCreateDialogOpen(true);
    setOpen(false);
  };

  const handleTagCreated = (tag: Tag) => {
    // Force cache invalidation when a new tag is created
    invalidateTagCache(targetType);
    // Call the parent's onTagSelected callback
    onTagSelected(tag);
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
            <TagIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">Add tag</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px]">
          <TagSearch 
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            tags={tags}
            targetType={targetType}
            onTagSelected={(tag) => {
              onTagSelected(tag);
              setSearchValue("");
              setOpen(false);
            }}
            handleOpenCreateDialog={handleOpenCreateDialog}
            user={user}
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
      />
    </>
  );
};

export default TagSelectorComponent;
