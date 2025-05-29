
import { useState } from "react";
import CommunitySearch from "@/components/community/CommunitySearch";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EntityType } from "@/types/entityTypes";
import { useSelectionTags } from "@/hooks/tags";
import TagSelector from "@/components/tags/TagSelector";
import { Tag } from "@/utils/tags";
import FilterPills from "@/components/filters/FilterPills";
import EntityFeed from "@/components/entities/EntityFeed";

const CommunityDirectory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  
  // Get all tags for finding the selected tag name
  const { data: allTagsResponse } = useSelectionTags(EntityType.PERSON);
  
  // Extract tags from the API response - handle both array and ApiResponse formats
  const allTags = Array.isArray(allTagsResponse) ? allTagsResponse : (allTagsResponse?.data || []);

  // Handle tag selection
  const handleTagSelected = (tag: Tag) => {
    setSelectedTagId(tag.id || null);
  };

  // Clear tag filter
  const clearTagFilter = () => {
    setSelectedTagId(null);
  };

  // Find selected tag for filter pills using the tags list
  const selectedTag = selectedTagId ? allTags.find(tag => tag.id === selectedTagId) : null;

  // Prepare filter pills
  const filterPills = [];
  if (selectedTag) {
    filterPills.push({
      id: selectedTag.id,
      label: selectedTag.name,
      onRemove: () => setSelectedTagId(null)
    });
  }

  return (
    <div className="container max-w-6xl px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Community Directory
        </h1>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <CommunitySearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </div>
            <div className="md:w-64">
              <TagSelector
                targetType={EntityType.PERSON}
                onTagSelected={handleTagSelected}
                currentSelectedTagId={selectedTagId}
              />
              {selectedTagId && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearTagFilter}
                  className="mt-2"
                >
                  Clear filter
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <FilterPills filters={filterPills} />

      <EntityFeed
        defaultEntityTypes={[EntityType.PERSON]}
        showTabs={false}
        showTagFilter={false}
        tagId={selectedTagId}
        search={searchQuery}
        isApproved={true}
        emptyMessage={selectedTagId ? "No community members match the selected tag." : "No community members found. Be the first to join!"}
        className="mt-6"
      />
    </div>
  );
};

export default CommunityDirectory;
