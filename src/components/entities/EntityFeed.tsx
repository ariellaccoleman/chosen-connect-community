import React, { useState, useEffect } from "react";
import { useEntityFeed } from "@/hooks/useEntityFeed";
import EntityList from "./EntityList";
import { EntityType } from "@/types/entityTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TagFilter from "../filters/TagFilter";
import { useSelectionTags } from "@/hooks/tags";
import { useEntitySystem } from "@/hooks/useEntitySystem";
import { logger } from "@/utils/logger";

interface EntityFeedProps {
  title?: string;
  defaultEntityTypes?: EntityType[];
  showTabs?: boolean;
  showTagFilter?: boolean;
  limit?: number;
  className?: string;
  emptyMessage?: string;
  tagId?: string; // Fixed tagId prop to match what's being passed in HubDetail.tsx
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
  } = useEntitySystem();
  
  // Enhanced logging for debugging tag filtering
  useEffect(() => {
    logger.debug(`EntityFeed initialized:`, {
      defaultEntityTypes,
      activeTab,
      excludedTypes: excludeEntityTypes,
      availableTypes: availableEntityTypes,
      showTagFilter,
      fixedTagId: tagId
    });
  }, [defaultEntityTypes, activeTab, excludeEntityTypes, availableEntityTypes, showTagFilter, tagId]);
  
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
  
  // Log when selectedTagId changes
  useEffect(() => {
    logger.debug(`EntityFeed: Tag selection changed to ${selectedTagId}`);
  }, [selectedTagId]);
  
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
  useEffect(() => {
    logger.debug(`EntityFeed: Found ${entities.length} entities with current filters`, {
      activeTab,
      selectedTagId,
      entityTypes: entityTypes.join(','),
      entities: entities.slice(0, 3).map(e => ({ id: e.id, name: e.name, type: e.entityType }))
    });
  }, [entities, activeTab, selectedTagId, entityTypes]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as "all" | EntityType);
    logger.debug(`EntityFeed: Tab changed to ${value}`);
  };
  
  // Make sure we don't allow changing the tag if it's fixed via props
  const onTagSelect = tagId ? undefined : setSelectedTagId;
  
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
            onTagSelect={onTagSelect}
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
