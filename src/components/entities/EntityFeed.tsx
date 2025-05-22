
import React, { useState } from "react";
import { useEntityFeed } from "@/hooks/useEntityFeed";
import EntityList from "./EntityList";
import { EntityType } from "@/types/entityTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TagFilter from "../filters/TagFilter";
import { useSelectionTags, useFilterByTag } from "@/hooks/tags";
import { useEntityRegistry } from "@/hooks/useEntityRegistry";
import { logger } from "@/utils/logger";

interface EntityFeedProps {
  title?: string;
  defaultEntityTypes?: EntityType[];
  showTabs?: boolean;
  showTagFilter?: boolean;
  limit?: number;
  className?: string;
  emptyMessage?: string;
  tagId?: string; // Added tagId prop to match what's being passed in HubDetail.tsx
  excludeEntityTypes?: EntityType[]; // New prop to exclude certain entity types
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
  emptyMessage = "No items found",
  tagId, // Add the tagId prop to destructuring
  excludeEntityTypes = []
}: EntityFeedProps) => {
  // Filter out excluded entity types
  const availableEntityTypes = defaultEntityTypes.filter(
    type => !excludeEntityTypes.includes(type)
  );

  const [activeTab, setActiveTab] = useState<"all" | EntityType>("all");
  const { 
    getEntityTypeLabel,
    getEntityTypePlural 
  } = useEntityRegistry();
  
  // Enhanced logging for debugging tag filtering
  React.useEffect(() => {
    logger.debug(`EntityFeed initialized:`, {
      defaultEntityTypes,
      activeTab,
      excludedTypes: excludeEntityTypes,
      availableTypes: availableEntityTypes,
      showTagFilter,
      fixedTagId: tagId
    });
  }, []);
  
  // Determine entity types to fetch based on the active tab
  const entityTypes = activeTab === "all" 
    ? availableEntityTypes 
    : [activeTab];
  
  // Fetch tags for filtering - use our consolidated hook
  const { data: tagsResponse, isLoading: tagsLoading } = useSelectionTags(
    activeTab !== "all" ? activeTab : undefined
  );
  
  // If tagId is provided from props, use it as the default selected tag
  const [selectedTagId, setSelectedTagId] = useState<string | null>(tagId || null);
  
  // Use the entity feed hook with enhanced tag filtering
  const { 
    entities, 
    isLoading
  } = useEntityFeed({
    entityTypes,
    limit,
    tagId: selectedTagId
  });
  
  // Log entity count when it changes 
  React.useEffect(() => {
    logger.debug(`EntityFeed: Found ${entities.length} entities with current filters`, {
      activeTab,
      selectedTagId,
      entityTypes: entityTypes.join(',')
    });
  }, [entities, activeTab, selectedTagId]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as "all" | EntityType);
    logger.debug(`EntityFeed: Tab changed to ${value}`);
  };
  
  // Extract tags from the response - ensuring we have an array
  const tags = tagsResponse?.data || [];
  
  return (
    <div className={className}>
      {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
      
      <div className="mb-6">
        {showTabs && availableEntityTypes.length > 1 && (
          <Tabs defaultValue="all" onValueChange={handleTabChange} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              {availableEntityTypes.map(type => (
                <TabsTrigger key={type} value={type}>
                  {getEntityTypePlural(type)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
        
        {showTagFilter && !tagId && ( // Only show tag filter if not using a fixed tagId
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
