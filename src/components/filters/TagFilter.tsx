
import React from "react";
import { Tag } from "@/utils/tags/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export interface TagFilterProps {
  selectedTagId: string | null;
  onTagSelect: (tagId: string | null) => void;
  tags?: Tag[];
  isLoading?: boolean;
  targetType?: string;
  label?: string;
}

const TagFilter = ({
  selectedTagId,
  onTagSelect,
  tags = [],
  isLoading = false,
  label = "Filter by Tag",
  targetType,
}: TagFilterProps) => {
  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  // Use "all" as a non-empty string value for the "All Tags" option
  const allTagsValue = "all";
  
  // Convert null to "all" for the Select value and handle conversion back in onValueChange
  const selectValue = selectedTagId || allTagsValue;

  return (
    <div>
      <Select
        value={selectValue}
        onValueChange={(value) => onTagSelect(value === allTagsValue ? null : value)}
      >
        <SelectTrigger>
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={allTagsValue}>All Tags</SelectItem>
          {tags.map((tag) => (
            <SelectItem key={tag.id} value={tag.id}>
              {tag.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TagFilter;
