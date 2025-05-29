import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { EntityType } from "@/types/entityTypes";
import TagSelector from "@/components/tags/TagSelector";
import { Tag } from "@/utils/tags/types";
import FilterPills from "@/components/filters/FilterPills";
import { useSelectionTags } from "@/hooks/tags/useTagFactoryHooks";

interface EntitySearchAndFilterProps {
  entityType: EntityType;
  searchPlaceholder?: string;
  tagPlaceholder?: string;
  onSearchChange: (search: string) => void;
  onTagChange: (tagId: string | null) => void;
  initialSearch?: string;
  initialTagId?: string | null;
}

const EntitySearchAndFilter = ({
  entityType,
  searchPlaceholder = "Search...",
  tagPlaceholder = "Select a tag to filter",
  onSearchChange,
  onTagChange,
  initialSearch = "",
  initialTagId = null
}: EntitySearchAndFilterProps) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(initialTagId);
  
  // Fetch tags to get proper names for filter pills
  const { data: tagsResponse } = useSelectionTags(entityType);
  const allTags = Array.isArray(tagsResponse) ? tagsResponse : (tagsResponse?.data || []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm, onSearchChange]);

  // Handle tag selection
  const handleTagSelect = (tag: Tag) => {
    const newTagId = tag.id === "" ? null : tag.id;
    setSelectedTagId(newTagId);
    onTagChange(newTagId);
  };

  // Clear tag filter
  const clearTagFilter = () => {
    setSelectedTagId(null);
    onTagChange(null);
  };

  // Find selected tag for filter pills
  const selectedTag = selectedTagId ? allTags.find(tag => tag.id === selectedTagId) : null;

  // Prepare filter pills
  const filterPills = [];
  if (selectedTag) {
    filterPills.push({
      id: selectedTag.id,
      label: selectedTag.name,
      onRemove: clearTagFilter
    });
  }

  return (
    <div>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="md:w-64">
              <TagSelector
                targetType={entityType}
                onTagSelected={handleTagSelect}
                isAdmin={false}
                placeholder={tagPlaceholder}
                currentSelectedTagId={selectedTagId}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mb-4">
        <FilterPills filters={filterPills} />
        {selectedTagId && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearTagFilter}
            className="flex-shrink-0"
          >
            Clear filter
          </Button>
        )}
      </div>
    </div>
  );
};

export default EntitySearchAndFilter;
