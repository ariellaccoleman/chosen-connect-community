
import React, { useState, useEffect, useMemo } from "react";
import { useEntityFeed } from "@/hooks/useEntityFeed";
import EntityList from "./EntityList";
import { EntityType } from "@/types/entityTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TagFilter from "../filters/TagFilter";
import { useSelectionTags } from "@/hooks/tags";
import { useEntitySystem } from "@/hooks/useEntitySystem";

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
  renderPagination?: (totalItems: number, totalPages: number, hasNextPage: boolean) => React.ReactNode;
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
  const availableEntityTypes = useMemo(() => 
    defaultEntityTypes.filter(type => !excludeEntityTypes.includes(type)),
    [defaultEntityTypes, excludeEntityTypes]
  );

  const [activeTab, setActiveTab] = useState<"all" | EntityType>("all");
  const { 
    getEntityTypeLabel,
    getEntityTypePlural 
  } = useEntitySystem();
  
  // Determine entity types to fetch based on the active tab
  const entityTypes = useMemo(() => 
    activeTab === "all" ? availableEntityTypes : [activeTab],
    [activeTab, availableEntityTypes]
  );
  
  // If tagId is provided from props, use it as the default selected tag
  const [selectedTagId, setSelectedTagId] = useState<string | null>(tagId || null);
  
  // Sync local tag state with prop changes
  useEffect(() => {
    setSelectedTagId(tagId || null);
  }, [tagId]);
  
  // Use the entity feed hook with server-side pagination
  const { 
    entities, 
    isLoading,
    totalCount,
    hasNextPage
  } = useEntityFeed({
    entityTypes,
    limit: renderPagination ? undefined : limit,
    tagId: selectedTagId,
    search,
    isApproved,
    currentPage,
    itemsPerPage
  });
  
  // Calculate pagination info
  const totalPages = useMemo(() => 
    renderPagination && itemsPerPage ? Math.ceil(totalCount / itemsPerPage) : 1,
    [renderPagination, itemsPerPage, totalCount]
  );
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as "all" | EntityType);
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
      
      {renderPagination && !isLoading && (
        renderPagination(totalCount, totalPages, hasNextPage)
      )}
    </div>
  );
};

export default EntityFeed;
