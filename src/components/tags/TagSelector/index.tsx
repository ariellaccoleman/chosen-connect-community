
import React from "react";
import TagSelectorComponent from "./TagSelectorComponent";
import { EntityType } from "@/types/entityTypes";
import { Tag } from "@/utils/tags/types";

interface TagSelectorProps {
  targetType: EntityType;
  onTagSelected: (tag: Tag) => void;
  isAdmin?: boolean;
  currentSelectedTagId?: string | null;
  entityId?: string; // Add entityId prop
}

const TagSelector = ({
  targetType, 
  onTagSelected, 
  isAdmin = false,
  currentSelectedTagId,
  entityId
}: TagSelectorProps) => {
  return (
    <TagSelectorComponent
      targetType={targetType}
      onTagSelected={onTagSelected}
      isAdmin={isAdmin}
      currentSelectedTagId={currentSelectedTagId}
      entityId={entityId}
    />
  );
};

export default TagSelector;
