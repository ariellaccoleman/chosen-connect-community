
import React from "react";
import { CommandGroup } from "@/components/ui/command";
import { Tag } from "@/utils/tags";
import TagCommandItem from "./TagCommandItem";

interface TagListProps {
  tags: Tag[];
  onTagSelected: (tag: Tag) => void;
  targetType: "person" | "organization";
}

const TagList = ({ tags, onTagSelected, targetType }: TagListProps) => {
  return (
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
  );
};

export default TagList;
