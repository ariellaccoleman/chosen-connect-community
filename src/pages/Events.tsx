
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { logger } from "@/utils/logger";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { EntityType } from "@/types/entityTypes";
import TagSelector from "@/components/tags/TagSelector";
import { Tag } from "@/utils/tags/types";
import FilterPills from "@/components/filters/FilterPills";
import EntityFeed from "@/components/entities/EntityFeed";

const Events: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  
  // Log page load for debugging
  logger.info("Events page mounted");
  
  // Handle tag selection
  const handleTagSelect = (tag: Tag) => {
    setSelectedTagId(tag.id === "" ? null : tag.id);
    logger.debug(`Events: Tag selected: ${tag.id}`);
  };

  // Prepare filter pills
  const filterPills = [];
  if (selectedTagId) {
    // Note: We'll need to get the tag name from the entities once they're loaded
    // For now, just show the tag ID
    filterPills.push({
      id: selectedTagId,
      label: `Tag: ${selectedTagId}`,
      onRemove: () => setSelectedTagId(null)
    });
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Events</h1>
        <Button 
          onClick={() => navigate("/events/create")}
          className="bg-chosen-blue hover:bg-chosen-navy flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Create Event
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search events by name, description, or location"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="md:w-64">
              <TagSelector
                targetType={EntityType.EVENT}
                onTagSelected={handleTagSelect}
                isAdmin={false}
                placeholder="Select a tag to filter events"
                currentSelectedTagId={selectedTagId}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <FilterPills filters={filterPills} />
      
      <EntityFeed
        defaultEntityTypes={[EntityType.EVENT]}
        showTabs={false}
        showTagFilter={false}
        tagId={selectedTagId}
        search={searchTerm}
        isApproved={true}
        emptyMessage={selectedTagId ? "No events match your selected tag. Try selecting a different tag or clear the filter." : searchTerm ? "No events match your search. Try different keywords." : "Your events will appear here. Refresh to check for new events."}
        className="mt-6"
      />
    </div>
  );
};

export default Events;
