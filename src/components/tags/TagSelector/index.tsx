
import React from "react";
import { Tag } from "@/utils/tags";
import TagSelectorComponent from "./TagSelectorComponent";

interface TagSelectorProps {
  targetType: "person" | "organization";
  onTagSelected: (tag: Tag) => void;
  isAdmin?: boolean;
}

const TagSelector = (props: TagSelectorProps) => {
  return <TagSelectorComponent {...props} />;
};

export default TagSelector;
