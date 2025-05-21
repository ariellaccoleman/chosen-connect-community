import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2, Plus, Tag as TagIcon } from "lucide-react";
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
import { toast } from "sonner";
import { logger } from "@/utils/logger";

export interface TagSelectorProps {
  targetType: EntityType | string;
  onTagSelected: (tag: Tag) => void;
  isAdmin?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const TagSelector = ({
  targetType,
  onTagSelected,
  isAdmin = false,
  disabled = false,
  placeholder = "Select a tag",
  className
}: TagSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  
  // Use our unified tag selection hook
  const { data: tagsResponse, isLoading, isError, error } = useSelectionTags(
    targetType as EntityType
  );
  
  // Extract the tags array from the response
  const tags = tagsResponse?.data || [];
  
  // Debug the tag loading
  useEffect(() => {
    if (tags.length > 0) {
      logger.debug(`TagSelector loaded ${tags.length} tags for entity type ${targetType}`);
    }
    
    if (isError) {
      logger.error("Error loading tags:", error);
    }
  }, [tags, isError, error, targetType]);

  const handleTagSelect = (tagId: string) => {
    const selectedTag = tags.find(tag => tag.id === tagId);
    if (selectedTag) {
      onTagSelected(selectedTag);
      setSearchValue("");
      setOpen(false);
    }
  };

  const handleCreateTag = async () => {
    if (!searchValue.trim()) return;
    
    setIsCreatingTag(true);
    
    try {
      const newTag = await findOrCreateTag({ 
        name: searchValue.trim() 
      }, targetType as EntityType);
      
      if (newTag) {
        logger.debug(`Created/found tag: ${newTag.name} (${newTag.id})`);
        onTagSelected(newTag);
        setSearchValue("");
        setOpen(false);
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
            <div className="flex items-center">
              <TagIcon className="mr-2 h-4 w-4" />
              <span>{placeholder}</span>
            </div>
            {isLoading ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                      onSelect={handleTagSelect}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <TagIcon className="mr-2 h-4 w-4" />
                        {tag.name}
                      </div>
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
