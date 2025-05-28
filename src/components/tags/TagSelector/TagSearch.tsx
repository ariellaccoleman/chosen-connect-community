
import React from "react";
import { Loader2, Plus } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Tag } from "@/utils/tags";
import { EntityType } from "@/types/entityTypes";
import { findOrCreateTag } from "@/utils/tags/tagOperations";
import { assignTag } from "@/utils/tags/tagAssignments";
import { toast } from "sonner";
import { logger } from "@/utils/logger";
import TagCommandItem from "./TagCommandItem";

interface TagSearchProps {
  searchValue: string;
  setSearchValue: (value: string) => void;
  tags: Tag[];
  targetType: EntityType;
  onTagSelected: (tag: Tag) => void;
  handleOpenCreateDialog: () => void;
  user: any;
  isLoading: boolean;
  entityId?: string;
}

const TagSearch = ({
  searchValue,
  setSearchValue,
  tags,
  targetType,
  onTagSelected,
  handleOpenCreateDialog,
  user,
  isLoading,
  entityId
}: TagSearchProps) => {
  const [isCreatingTag, setIsCreatingTag] = React.useState(false);

  const handleCreateTag = async () => {
    if (!searchValue.trim()) return;
    
    setIsCreatingTag(true);
    
    try {
      // Create or find the tag
      const newTag = await findOrCreateTag({ 
        name: searchValue.trim() 
      });
      
      if (newTag) {
        logger.debug(`Created/found tag: ${newTag.name} (${newTag.id})`);
        
        // If we have an entityId, immediately assign the tag to this entity
        if (entityId) {
          const assignmentSuccess = await assignTag(
            newTag.id,
            entityId,
            targetType
          );
          
          if (assignmentSuccess) {
            logger.debug(`Successfully assigned tag ${newTag.id} to entity ${entityId}`);
          } else {
            logger.warn(`Failed to assign tag ${newTag.id} to entity ${entityId}, but continuing`);
          }
        }
        
        onTagSelected(newTag);
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
    <Command className="w-full" shouldFilter={false}>
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
              {user?.id && (
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
              <TagCommandItem
                key={tag.id}
                tag={tag}
                onSelect={() => onTagSelected(tag)}
              />
            ))}
          {user?.id && searchValue.trim() && !tags.some(tag => 
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
  );
};

export default TagSearch;
