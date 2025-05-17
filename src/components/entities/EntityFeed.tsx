
import React, { useState } from "react";
import { useEntityFeed } from "@/hooks/useEntityFeed";
import EntityList from "./EntityList";
import { EntityType } from "@/types/entityTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TagFilter from "../filters/TagFilter";
import { useFilterByTag, useSelectionTags } from "@/hooks/tags";
import { useEntityRegistry } from "@/hooks/useEntityRegistry";

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
  const { 
    getEntityTypeLabel,
    getEntityTypePlural 
  } = useEntityRegistry();
  
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

  // Fetch tags for filtering - use our consolidated hook
  const { data: tagsResponse, isLoading: tagsLoading } = useSelectionTags(
    activeTab !== "all" ? activeTab : undefined
  );
  
  // Get tag assignments using our filter-by-tag hook
  const { data: tagAssignments = [] } = useFilterByTag(
    selectedTagId,
    activeTab !== "all" ? activeTab : undefined
  );
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as "all" | EntityType);
  };
  
  // Extract tags from the response - ensuring we have an array
  const tags = tagsResponse?.data || [];
  
  return (
    <div className={className}>
      {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
      
      <div className="mb-6">
        {showTabs && (
          <Tabs defaultValue="all" onValueChange={handleTabChange} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              {defaultEntityTypes.map(type => (
                <TabsTrigger key={type} value={type}>
                  {getEntityTypePlural(type)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
        
        {showTagFilter && (
          <TagFilter
            selectedTagId={selectedTagId}
            onTagSelect={setSelectedTagId}
            tags={tags}
            isLoading={tagsLoading}
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
