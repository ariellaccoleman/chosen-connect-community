
import React, { useState } from "react";
import { useEntityFeed } from "@/hooks/useEntityFeed";
import EntityList from "./EntityList";
import { EntityType } from "@/types/entityTypes";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TagFilter from "../filters/TagFilter";

interface EntityFeedProps {
  title?: string;
  defaultEntityTypes?: EntityType[];
  showTabs?: boolean;
  showTagFilter?: boolean;
  limit?: number;
  className?: string;
  emptyMessage?: string;
}

/**
 * Component for displaying a feed of entities, with optional filtering by type and tags
 */
const EntityFeed = ({
  title = "Entity Feed",
  defaultEntityTypes = Object.values(EntityType),
  showTabs = true,
  showTagFilter = true,
  limit,
  className = "",
  emptyMessage = "No items found"
}: EntityFeedProps) => {
  const [activeTab, setActiveTab] = useState<"all" | EntityType>("all");
  
  // Determine entity types to fetch based on the active tab
  const entityTypes = activeTab === "all" 
    ? defaultEntityTypes 
    : [activeTab];
  
  const { 
    entities, 
    isLoading, 
    selectedTagId, 
    setSelectedTagId 
  } = useEntityFeed({
    entityTypes,
    limit
  });
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as "all" | EntityType);
  };
  
  return (
    <div className={className}>
      {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
      
      <div className="mb-6">
        {showTabs && (
          <Tabs defaultValue="all" onValueChange={handleTabChange} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value={EntityType.PERSON}>People</TabsTrigger>
              <TabsTrigger value={EntityType.ORGANIZATION}>Organizations</TabsTrigger>
              <TabsTrigger value={EntityType.EVENT}>Events</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        
        {showTagFilter && (
          <TagFilter
            selectedTagId={selectedTagId}
            onTagSelect={setSelectedTagId}
            targetType={activeTab !== "all" ? activeTab : undefined}
          />
        )}
      </div>
      
      <EntityList 
        entities={entities} 
        isLoading={isLoading} 
        emptyMessage={emptyMessage}
      />
    </div>
  );
};

export default EntityFeed;
