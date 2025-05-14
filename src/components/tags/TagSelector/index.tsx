
import React from "react";
import { Tag } from "@/utils/tags";
import TagSelectorComponent from "./TagSelectorComponent";
import { EntityType } from "@/types/entityTypes";

interface TagSelectorProps {
  targetType: EntityType;
  onTagSelected: (tag: Tag) => void;
  isAdmin?: boolean;
}

const TagSelector = (props: TagSelectorProps) => {
  return <TagSelectorComponent {...props} />;
};

export default TagSelector;
