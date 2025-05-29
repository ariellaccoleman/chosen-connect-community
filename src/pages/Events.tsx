
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { logger } from "@/utils/logger";
import { EntityType } from "@/types/entityTypes";
import EntityFeed from "@/components/entities/EntityFeed";
import EntitySearchAndFilter from "@/components/common/EntitySearchAndFilter";

const Events: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  
  // Log page load for debugging
  logger.info("Events page mounted");

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
      
      <EntitySearchAndFilter
        entityType={EntityType.EVENT}
        searchPlaceholder="Search events by name, description, or location"
        tagPlaceholder="Select a tag to filter events"
        onSearchChange={setSearchTerm}
        onTagChange={setSelectedTagId}
      />
      
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
