
import React from "react";
import { Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface TagFilterProps {
  selectedTagId: string | null;
  onSelectTag: (tagId: string | null) => void;
  tags: any[];
  isLoading?: boolean;
  className?: string;
}

const TagFilter = ({ 
  selectedTagId, 
  onSelectTag, 
  tags = [],
  isLoading = false,
  className 
}: TagFilterProps) => {
  if (isLoading) {
    return (
      <div className={`animate-pulse flex items-center ${className}`}>
        <div className="w-36 h-10 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1">
        <Select
          value={selectedTagId || "all"} 
          onValueChange={(value) => onSelectTag(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <SelectValue placeholder="Filter by tag" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All tags</SelectItem>
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    {tag.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-tags" disabled>
                  No tags available
                </SelectItem>
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      {selectedTagId && (
        <ActiveTagFilter 
          tags={tags} 
          selectedTagId={selectedTagId} 
          onClear={() => onSelectTag(null)} 
        />
      )}
    </div>
  );
};

// Helper component to display the currently active tag filter
const ActiveTagFilter = ({ 
  tags, 
  selectedTagId, 
  onClear 
}: { 
  tags: any[]; 
  selectedTagId: string;
  onClear: () => void;
}) => {
  const selectedTag = tags.find(tag => tag.id === selectedTagId);
  
  if (!selectedTag) return null;
  
  return (
    <Badge variant="outline" className="flex items-center gap-1">
      {selectedTag.name}
      <button 
        onClick={onClear}
        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
        aria-label="Clear tag filter"
      >
        <X size={12} />
      </button>
    </Badge>
  );
};

export default TagFilter;
