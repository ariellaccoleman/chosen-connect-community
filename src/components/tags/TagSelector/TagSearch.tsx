
import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Tag, getTagEntityTypes } from "@/utils/tags";
import { User } from "@supabase/supabase-js";

interface TagSearchProps {
  searchValue: string;
  setSearchValue: (value: string) => void;
  tags: Tag[];
  targetType: "person" | "organization";
  onTagSelected: (tag: Tag) => void;
  handleOpenCreateDialog: () => void;
  user: User | null;
}

const TagSearch = ({
  searchValue,
  setSearchValue,
  tags,
  targetType,
  onTagSelected,
  handleOpenCreateDialog,
  user
}: TagSearchProps) => {
  return (
    <Command>
      <CommandInput
        placeholder="Search tags..."
        value={searchValue}
        onValueChange={setSearchValue}
      />
      <CommandList>
        <CommandEmpty>
          <div className="py-6 text-center text-sm">
            <p className="text-muted-foreground">No tags found</p>
            {user && (
              <Button
                variant="outline"
                className="mt-2"
                size="sm"
                onClick={handleOpenCreateDialog}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create "{searchValue}"
              </Button>
            )}
            {!user && (
              <p className="text-muted-foreground mt-2">
                Please log in to create tags
              </p>
            )}
          </div>
        </CommandEmpty>
        <CommandGroup>
          {tags.map((tag) => (
            <TagCommandItem 
              key={tag.id} 
              tag={tag} 
              onSelect={() => onTagSelected(tag)} 
              targetType={targetType}
            />
          ))}
        </CommandGroup>
        {searchValue && user && (
          <div className="p-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleOpenCreateDialog}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create new tag
            </Button>
          </div>
        )}
      </CommandList>
    </Command>
  );
};

interface TagCommandItemProps {
  tag: Tag;
  onSelect: () => void;
  targetType: "person" | "organization";
}

const TagCommandItem = ({ tag, onSelect, targetType }: TagCommandItemProps) => {
  const [entityTypeInfo, setEntityTypeInfo] = useState<string | null>(null);
  const [isDifferentType, setIsDifferentType] = useState(false);
  
  // Get entity type info when tag is rendered
  useEffect(() => {
    const getInfo = async () => {
      const entityTypes = await getTagEntityTypes(tag.id);
      const isDifferent = !entityTypes.includes(targetType) && entityTypes.length > 0;
      setIsDifferentType(isDifferent);
      
      if (isDifferent) {
        const typeInfo = entityTypes
          .map(type => type === "person" ? "People" : "Organizations")
          .join(", ");
        setEntityTypeInfo(typeInfo);
      }
    };
    
    getInfo();
  }, [tag.id, targetType]);
  
  return (
    <CommandItem
      value={tag.name}
      onSelect={onSelect}
      className="flex items-center justify-between"
    >
      <div className="flex flex-col">
        <div className="flex items-center">
          <span>{tag.name}</span>
          {isDifferentType && entityTypeInfo && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({entityTypeInfo})
            </span>
          )}
        </div>
        
        {tag.description && (
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {tag.description}
          </span>
        )}
      </div>
      {tag.is_public && (
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
          Public
        </span>
      )}
    </CommandItem>
  );
};

export default TagSearch;
