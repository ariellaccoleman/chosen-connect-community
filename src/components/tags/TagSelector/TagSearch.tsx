
import React from "react";
import { 
  Command, 
  CommandEmpty, 
  CommandInput,
  CommandList,
  CommandGroup
} from "@/components/ui/command";
import { Tag } from "@/utils/tags";
import { User } from "@supabase/supabase-js";
import TagList from "./TagList";
import EmptySearchState from "./EmptySearchState";
import TagCreateFooter from "./TagCreateFooter";
import { EntityType } from "@/types/entityTypes";
import { Loader2 } from "lucide-react";

interface TagSearchProps {
  searchValue: string;
  setSearchValue: (value: string) => void;
  tags: Tag[];
  targetType: EntityType;
  onTagSelected: (tag: Tag) => void;
  handleOpenCreateDialog: () => void;
  user: User | null;
  isLoading?: boolean;
}

const TagSearch = ({
  searchValue,
  setSearchValue,
  tags,
  targetType,
  onTagSelected,
  handleOpenCreateDialog,
  user,
  isLoading = false
}: TagSearchProps) => {
  return (
    <Command>
      <CommandInput
        placeholder="Search tags..."
        value={searchValue}
        onValueChange={setSearchValue}
      />
      <CommandList>
        {isLoading ? (
          <CommandGroup>
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Fixing tag associations...</span>
            </div>
          </CommandGroup>
        ) : (
          <>
            <CommandEmpty>
              <EmptySearchState 
                searchValue={searchValue}
                handleOpenCreateDialog={handleOpenCreateDialog}
                user={user}
              />
            </CommandEmpty>
            
            <TagList 
              tags={tags} 
              onTagSelected={onTagSelected} 
              targetType={targetType} 
            />
            
            {searchValue && user && (
              <TagCreateFooter 
                searchValue={searchValue} 
                handleOpenCreateDialog={handleOpenCreateDialog} 
              />
            )}
          </>
        )}
      </CommandList>
    </Command>
  );
};

export default TagSearch;
