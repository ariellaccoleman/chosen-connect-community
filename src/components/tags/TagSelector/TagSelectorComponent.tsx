
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
import { tagApi } from "@/api/tags";

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
  const [isLoading, setIsLoading] = useState(false);

  // Load tags when search criteria changes or when popover opens
  useEffect(() => {
    if (open || searchValue) {
      loadTagsWithDebounce();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, targetType, isAdmin, user?.id, open]);

  // Find and set the selected tag when currentSelectedTagId changes
  useEffect(() => {
    if (currentSelectedTagId) {
      const findSelectedTag = async () => {
        try {
          setIsLoading(true);
          const tag = await tagApi.getById(currentSelectedTagId);
          if (tag) {
            setSelectedTag(tag);
          }
        } catch (err) {
          logger.error("Error fetching selected tag:", err);
        } finally {
          setIsLoading(false);
        }
      };
      
      findSelectedTag();
    } else {
      setSelectedTag(null);
    }
  }, [currentSelectedTagId]);

  /**
   * Load tags with debounce to prevent excessive API calls
   */
  const loadTagsWithDebounce = () => {
    const timeoutId = setTimeout(async () => {
      await loadTagsBasedOnSearch();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  /**
   * Load tags based on search criteria
   */
  const loadTagsBasedOnSearch = async () => {
    setIsLoading(true);
    try {
      logger.debug(`Loading tags for entity type: ${targetType}`);
      let fetchedTags: Tag[] = [];
      
      if (searchValue) {
        // Search by name
        fetchedTags = await tagApi.searchByName(searchValue);
      } else {
        // Get tags for entity type
        fetchedTags = await tagApi.getByEntityType(targetType);
      }
      
      logger.debug("Fetched tags:", fetchedTags);
      setTags(fetchedTags);
    } catch (err) {
      logger.error("Error fetching tags:", err);
      toast.error("Failed to load tags. Please try again.");
      setTags([]);
    } finally {
      setIsLoading(false);
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
    setSelectedTag(tag);
    // Call the parent's onTagSelected callback
    onTagSelected(tag);
    
    // Reload tags to include the new one
    loadTagsBasedOnSearch();
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
            isLoading={isLoading}
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
