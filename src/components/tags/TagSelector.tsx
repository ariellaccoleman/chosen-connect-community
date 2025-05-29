import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2, Plus, Tag as TagIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { EntityType } from "@/types/entityTypes";
import { Tag } from "@/utils/tags";
import { useSelectionTags } from "@/hooks/tags";
import { findOrCreateTag } from "@/utils/tags/tagOperations";
import { assignTag } from "@/utils/tags/tagAssignments";
import { toast } from "sonner";
import { logger } from "@/utils/logger";
import { tagApi } from "@/api/tags/factory/tagApiFactory";

export interface TagSelectorProps {
  targetType: EntityType | string;
  onTagSelected: (tag: Tag) => void;
  isAdmin?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  currentSelectedTagId?: string | null;
  entityId?: string;
}

const TagSelector = ({
  targetType,
  onTagSelected,
  isAdmin = false,
  disabled = false,
  placeholder = "Select a tag",
  className,
  currentSelectedTagId,
  entityId
}: TagSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load tags on init or when search changes
  useEffect(() => {
    if (open || searchValue) {
      loadTags();
    }
  }, [open, searchValue, targetType]);
  
  // Set the selected tag when currentSelectedTagId changes
  useEffect(() => {
    if (currentSelectedTagId) {
      const findTag = async () => {
        try {
          const response = await tagApi.getById(currentSelectedTagId);
          if (response.error) {
            logger.error("Error fetching selected tag:", response.error);
            return;
          }
          if (response.data) {
            setSelectedTag(response.data);
          }
        } catch (err) {
          logger.error("Error fetching selected tag:", err);
        }
      };
      
      findTag();
    } else {
      setSelectedTag(null);
    }
  }, [currentSelectedTagId]);
  
  const loadTags = async () => {
    setIsLoading(true);
    try {
      let fetchedTags: Tag[] = [];
      
      if (searchValue) {
        // If there's a search query, search by name
        const response = await tagApi.searchByName(searchValue);
        if (response.error) {
          logger.error("Error searching tags:", response.error);
          setTags([]);
          return;
        }
        fetchedTags = response.data || [];
      } else {
        // Otherwise get tags for entity type
        const response = await tagApi.getByEntityType(targetType as EntityType);
        if (response.error) {
          logger.error("Error loading tags:", response.error);
          setTags([]);
          return;
        }
        fetchedTags = response.data || [];
      }
      
      logger.debug(`TagSelector loaded ${fetchedTags.length} tags for entity type ${targetType}`);
      setTags(fetchedTags);
    } catch (error) {
      logger.error("Error loading tags:", error);
      setTags([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagSelect = (tagId: string) => {
    const selectedTag = tags.find(tag => tag.id === tagId);
    if (selectedTag) {
      setSelectedTag(selectedTag);
      onTagSelected(selectedTag);
      setSearchValue("");
      setOpen(false);
    }
  };

  const handleCreateTag = async () => {
    if (!searchValue.trim()) return;
    
    setIsCreatingTag(true);
    
    try {
      // Create or find the tag - no need to pass user ID
      const newTag = await findOrCreateTag({ 
        name: searchValue.trim() 
      });
      
      if (newTag) {
        logger.debug(`Created/found tag: ${newTag.name} (${newTag.id})`);
        
        // Just call onTagSelected - let the parent handle assignment
        setSelectedTag(newTag);
        onTagSelected(newTag);
        setSearchValue("");
        setOpen(false);
        // Refresh tag list
        loadTags();
      } else {
        toast.error("Failed to create tag");
      }
    } catch (error) {
      logger.error("Error creating tag:", error);
      toast.error("Failed to create tag");
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleClearTag = () => {
    setSelectedTag(null);
    onTagSelected({ id: "", name: "" } as Tag); // Pass an empty tag to trigger filtering reset
    setSearchValue("");
  };

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between"
          >
            {selectedTag ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <TagIcon className="mr-2 h-4 w-4" />
                  <span className="truncate">{selectedTag.name}</span>
                </div>
                <X 
                  className="h-4 w-4 opacity-70 hover:opacity-100 cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearTag();
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center">
                <TagIcon className="mr-2 h-4 w-4" />
                <span>{placeholder}</span>
              </div>
            )}
            {!selectedTag && (
              <>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                )}
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command
            className="w-full"
            shouldFilter={false}
          >
            <CommandInput 
              placeholder="Search or create tags..." 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty className="py-3 px-4 text-center text-sm">
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Loading tags...</span>
                  </div>
                ) : (
                  <div>
                    <p className="mb-2">No tags found</p>
                    {isAdmin && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mx-auto flex items-center"
                        onClick={handleCreateTag}
                        disabled={!searchValue.trim() || isCreatingTag}
                      >
                        {isCreatingTag ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Plus className="h-4 w-4 mr-1" />
                        )}
                        Create "{searchValue}"
                      </Button>
                    )}
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup heading="Available Tags">
                {tags
                  .filter(tag => tag.name.toLowerCase().includes(searchValue.toLowerCase()))
                  .map(tag => (
                    <CommandItem
                      key={tag.id}
                      value={tag.id}
                      onSelect={() => handleTagSelect(tag.id)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <TagIcon className="mr-2 h-4 w-4" />
                        {tag.name}
                      </div>
                      {selectedTag?.id === tag.id && (
                        <Check className="h-4 w-4" />
                      )}
                    </CommandItem>
                  ))}
                {isAdmin && searchValue.trim() && !tags.some(tag => 
                  tag.name.toLowerCase() === searchValue.toLowerCase()) && (
                  <CommandItem
                    value={`new-${searchValue}`}
                    onSelect={handleCreateTag}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <Plus className="mr-2 h-4 w-4" />
                      Create "{searchValue}"
                    </div>
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default TagSelector;
