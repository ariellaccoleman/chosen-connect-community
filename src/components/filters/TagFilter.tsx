
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface TagFilterProps {
  selectedTagId: string;
  onSelectTag: (tagId: string) => void;
  tags?: any[];
  availableTags?: any[];
  isLoading?: boolean;
  targetType?: string;
}

const TagFilter = ({ 
  selectedTagId, 
  onSelectTag, 
  availableTags = [], 
  tags = [],
  isLoading = false
}: TagFilterProps) => {
  // Use either tags or availableTags, whichever is provided
  const tagOptions = tags.length > 0 ? tags : availableTags;
  
  return (
    <Select value={selectedTagId} onValueChange={onSelectTag}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Filter by Tag" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All Tags</SelectItem>
        {tagOptions.map((tag) => (
          <SelectItem key={tag.id} value={tag.id}>
            {tag.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TagFilter;
