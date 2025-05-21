import React, { useState } from "react";
import { useEntityFeed } from "@/hooks/useEntityFeed";
import EntityList from "./EntityList";
import { EntityType } from "@/types/entityTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TagFilter from "../filters/TagFilter";
import { useSelectionTags, useFilterByTag } from "@/hooks/tags";
import { useEntityRegistry } from "@/hooks/useEntityRegistry";

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
  
  // Determine entity types to fetch based on the active tab
  const entityTypes = activeTab === "all" 
    ? availableEntityTypes 
    : [activeTab];
  
  // Fetch tags for filtering - use our consolidated hook
  const { data: tagsResponse, isLoading: tagsLoading } = useSelectionTags(
    activeTab !== "all" ? activeTab : undefined
  );
  
  // Get tag assignments using our filter-by-tag hook
  // If tagId is provided from props, use it as the default selected tag
  const [selectedTagId, setSelectedTagId] = useState<string | null>(tagId || null);
  const { data: tagAssignments = [] } = useFilterByTag(
    selectedTagId,
    activeTab !== "all" ? activeTab : undefined
  );
  
  // Use the entity feed hook
  const { 
    entities, 
    isLoading
  } = useEntityFeed({
    entityTypes,
    limit,
    tagId: selectedTagId
  });
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as "all" | EntityType);
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
            selectedTagId={selectedTagId || ""}
            onSelectTag={setSelectedTagId}
            tags={tags}
            isLoading={tagsLoading}
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
