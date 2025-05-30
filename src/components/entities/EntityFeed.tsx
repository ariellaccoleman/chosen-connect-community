
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
  tagId?: string;
  excludeEntityTypes?: EntityType[];
  // Profile-specific props
  search?: string;
  isApproved?: boolean;
  // Pagination props
  currentPage?: number;
  itemsPerPage?: number;
  renderPagination?: (totalItems: number, totalPages: number) => React.ReactNode;
}

/**
 * Component for displaying a feed of entities, with optional filtering by type and tags
 */
const EntityFeed = ({
  title = "",
  defaultEntityTypes = Object.values(EntityType),
  showTabs = true,
  showTagFilter = true,
  limit,
  className = "",
  emptyMessage = "No items found",
  tagId,
  excludeEntityTypes = [],
  search = "",
  isApproved = true,
  currentPage = 1,
  itemsPerPage = 12,
  renderPagination
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
      fixedTagId: tagId,
      search,
      isApproved,
      currentPage,
      itemsPerPage
    });
  }, [defaultEntityTypes, activeTab, excludeEntityTypes, availableEntityTypes, showTagFilter, tagId, search, isApproved, currentPage, itemsPerPage]);
  
  // Determine entity types to fetch based on the active tab
  const entityTypes = activeTab === "all" 
    ? availableEntityTypes 
    : [activeTab];
  
  // If tagId is provided from props, use it as the default selected tag
  const [selectedTagId, setSelectedTagId] = useState<string | null>(tagId || null);
  
  // Sync local tag state with prop changes - THIS IS THE FIX
  useEffect(() => {
    setSelectedTagId(tagId || null);
    logger.debug(`EntityFeed: Tag prop changed, updating selectedTagId to ${tagId}`);
  }, [tagId]);
  
  // Log when selectedTagId changes
  useEffect(() => {
    logger.debug(`EntityFeed: Tag selection changed to ${selectedTagId}`);
  }, [selectedTagId]);
  
  // Use the entity feed hook with pagination parameters
  const { 
    entities, 
    isLoading,
    totalCount
  } = useEntityFeed({
    entityTypes,
    limit: renderPagination ? undefined : limit,
    tagId: selectedTagId,
    search,
    isApproved,
    currentPage,
    itemsPerPage
  });
  
  // Calculate pagination
  const totalPages = renderPagination && itemsPerPage ? Math.ceil(totalCount / itemsPerPage) : 1;
  
  // Log entity count when it changes 
  useEffect(() => {
    logger.debug(`EntityFeed: Found ${entities.length} entities with current filters`, {
      activeTab,
      selectedTagId,
      entityTypes: entityTypes.join(','),
      search,
      isApproved,
      totalCount,
      currentPage,
      totalPages,
      entities: entities.slice(0, 3).map(e => ({ id: e.id, name: e.name, type: e.entityType }))
    });
  }, [entities, activeTab, selectedTagId, entityTypes, search, isApproved, totalCount, currentPage, totalPages]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as "all" | EntityType);
    logger.debug(`EntityFeed: Tab changed to ${value}`);
  };
  
  // Make sure we don't allow changing the tag if it's fixed via props
  const onTagSelect = tagId ? undefined : setSelectedTagId;
  
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
            targetType={activeTab !== "all" ? activeTab : undefined}
          />
        )}
      </div>
      
      <EntityList 
        entities={entities} 
        isLoading={isLoading} 
        emptyMessage={emptyMessage}
      />
      
      {renderPagination && !isLoading && totalCount > 0 && (
        renderPagination(totalCount, totalPages)
      )}
    </div>
  );
};

export default EntityFeed;
