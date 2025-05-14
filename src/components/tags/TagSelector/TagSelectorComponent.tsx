
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
  currentSelectedTagId?: string | null;
}

/**
 * Component for selecting and creating tags
 */
const TagSelectorComponent = ({ 
  targetType, 
  onTagSelected, 
  isAdmin = false,
  currentSelectedTagId
}: TagSelectorComponentProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const { user } = useAuth();

  // Load tags when search criteria changes
  useEffect(() => {
    loadTagsWithDebounce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, targetType, isAdmin, user?.id, open]);

  // Find and set the selected tag when currentSelectedTagId changes
  useEffect(() => {
    if (currentSelectedTagId) {
      const findSelectedTag = async () => {
        try {
          const allTags = await fetchSelectionTags({ 
            targetType,
            skipCache: true
          });
          const found = allTags.find(tag => tag.id === currentSelectedTagId);
          if (found) {
            setSelectedTag(found);
          }
        } catch (err) {
          console.error("Error fetching selected tag:", err);
        }
      };
      
      findSelectedTag();
    } else {
      setSelectedTag(null);
    }
  }, [currentSelectedTagId, targetType]);

  /**
   * Load tags with debounce to prevent excessive API calls
   */
  const loadTagsWithDebounce = () => {
    const timeoutId = setTimeout(async () => {
      // Only refresh cache when opening the popover with no search
      if (searchValue === "" && open) {
        await refreshTagCache();
      }

      await loadTagsBasedOnSearch();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  /**
   * Try to refresh the tag cache
   */
  const refreshTagCache = async () => {
    try {
      await invalidateTagCache(targetType);
    } catch (err) {
      console.error("Failed to invalidate tag cache:", err);
    }
  };

  /**
   * Load tags based on search criteria
   */
  const loadTagsBasedOnSearch = async () => {
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
    // Force cache invalidation when a new tag is created
    invalidateTagCache(targetType);
    setSelectedTag(tag);
    // Call the parent's onTagSelected callback
    onTagSelected(tag);
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
            tags={tags}
            targetType={targetType}
            onTagSelected={handleTagSelection}
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
