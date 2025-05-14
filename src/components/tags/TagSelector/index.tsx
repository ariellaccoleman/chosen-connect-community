
import React from "react";
import TagSelectorComponent from "./TagSelectorComponent";
import { EntityType } from "@/types/entityTypes";
import { Tag } from "@/utils/tags/types";

interface TagSelectorProps {
  targetType: EntityType;
  onTagSelected: (tag: Tag) => void;
  isAdmin?: boolean;
  currentSelectedTagId?: string | null;
}

const TagSelector = ({
  targetType, 
  onTagSelected, 
  isAdmin = false,
  currentSelectedTagId
}: TagSelectorProps) => {
  return (
    <TagSelectorComponent
      targetType={targetType}
      onTagSelected={onTagSelected}
      isAdmin={isAdmin}
      currentSelectedTagId={currentSelectedTagId}
    />
  );
};

export default TagSelector;
