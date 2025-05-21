
import React from "react";
import { Tag } from "@/utils/tags/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronDown, Tag as TagIcon, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface TagFilterProps {
  selectedTagIds: string[];
  onTagSelect: (tagIds: string[]) => void;
  tags?: Tag[];
  isLoading?: boolean;
  targetType?: string;
  label?: string;
  className?: string;
}

const TagFilter = ({
  selectedTagIds = [],
  onTagSelect,
  tags = [],
  isLoading = false,
  label = "Filter by Tags",
  targetType,
  className,
}: TagFilterProps) => {
  const [open, setOpen] = React.useState(false);
  
  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  // Find the selected tags to display their names
  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));
  
  const handleTagToggle = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagSelect(selectedTagIds.filter(id => id !== tagId));
    } else {
      onTagSelect([...selectedTagIds, tagId]);
    }
  };
  
  const clearTags = () => {
    onTagSelect([]);
    setOpen(false);
  };

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <div className="flex gap-1 flex-wrap items-center">
              <TagIcon className="h-4 w-4 shrink-0 opacity-50" />
              {selectedTags.length > 0 ? (
                <span className="mr-1">{selectedTags.length} selected</span>
              ) : (
                <span>{label}</span>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>No tags found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={clearTags}
                  className="justify-center text-center"
                >
                  Clear all filters
                </CommandItem>
                
                {tags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => handleTagToggle(tag.id)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <TagIcon className="mr-2 h-4 w-4" />
                        {tag.name}
                      </div>
                      {isSelected && <Check className="h-4 w-4" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Display selected tags as badges */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedTags.map((tag) => (
            <Badge 
              key={tag.id} 
              variant="secondary"
              className="flex items-center gap-1 px-2 py-0.5"
            >
              {tag.name}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleTagToggle(tag.id);
                }}
              />
            </Badge>
          ))}
          <Badge 
            variant="outline"
            className="flex items-center gap-1 px-2 py-0.5 cursor-pointer"
            onClick={clearTags}
          >
            Clear all
          </Badge>
        </div>
      )}
    </div>
  );
};

export default TagFilter;
