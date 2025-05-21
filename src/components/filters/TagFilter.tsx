import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface TagFilterProps {
  selectedTagId: string;
  onSelectTag: (tagId: string) => void;
  availableTags: any[];
}

const TagFilter = ({ selectedTagId, onSelectTag, availableTags }: TagFilterProps) => {
  return (
    <Select value={selectedTagId} onValueChange={onSelectTag}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Filter by Tag" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All Tags</SelectItem>
        {availableTags.map((tag) => (
          <SelectItem key={tag.id} value={tag.id}>
            {tag.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TagFilter;
