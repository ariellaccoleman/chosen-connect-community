
import React from "react";
import { 
  Command, 
  CommandEmpty, 
  CommandInput,
  CommandList 
} from "@/components/ui/command";
import { Tag } from "@/utils/tags";
import { User } from "@supabase/supabase-js";
import TagList from "./TagList";
import EmptySearchState from "./EmptySearchState";
import TagCreateFooter from "./TagCreateFooter";
import { EntityType } from "@/types/entityTypes";

interface TagSearchProps {
  searchValue: string;
  setSearchValue: (value: string) => void;
  tags: Tag[];
  targetType: EntityType;
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
      </CommandList>
    </Command>
  );
};

export default TagSearch;
