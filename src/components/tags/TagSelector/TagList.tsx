
import React from "react";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { Tag } from "@/utils/tags";
import TagCommandItem from "./TagCommandItem";
import { EntityType } from "@/types/entityTypes";

interface TagListProps {
  tags: Tag[];
  onTagSelected: (tag: Tag) => void;
  targetType: EntityType;
}

const TagList = ({ tags, onTagSelected, targetType }: TagListProps) => {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <CommandGroup heading="Available Tags">
      {tags.map((tag) => (
        <TagCommandItem
          key={tag.id}
          tag={tag}
          targetType={targetType}
          onSelect={() => onTagSelected(tag)}
        />
      ))}
    </CommandGroup>
  );
};

export default TagList;
