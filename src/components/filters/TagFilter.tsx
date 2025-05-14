
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

  return (
    <div>
      <Select
        value={selectedTagId || ""}
        onValueChange={(value) => onTagSelect(value === "" ? null : value)}
      >
        <SelectTrigger>
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Tags</SelectItem>
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
