
import React, { useMemo, useState } from 'react';
import HubCard from './HubCard';
import { useHubs, useToggleHubFeatured } from '@/hooks/hubs';
import { HubWithDetails } from '@/types/hub';
import { Skeleton } from '@/components/ui/skeleton';
import { useSelectionTags, useFilterByTag } from '@/hooks/tags';
import { EntityType } from '@/types/entityTypes';
import TagFilter from '@/components/filters/TagFilter';
import { logger } from '@/utils/logger';

interface HubGridProps {
  isAdmin?: boolean;
  featuredOnly?: boolean;
}

// Skeleton loader for hub cards
const HubCardSkeleton: React.FC = () => (
  <div className="space-y-3">
    <Skeleton className="h-[150px] w-full rounded-lg" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

const HubGrid: React.FC<HubGridProps> = ({
  isAdmin = false,
  featuredOnly = false
}) => {
  // State for selected tag
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  
  // Fetch all hubs
  const { data: hubsResponse, isLoading } = useHubs();
  
  // Fetch tags for filtering
  const { data: tagsResponse, isLoading: isTagsLoading } = useSelectionTags(EntityType.HUB);
  
  // Get tag assignments if a tag is selected
  const { data: tagAssignments = [] } = useFilterByTag(selectedTagId, EntityType.HUB);
  
  // Extract tags from the response
  const tags = tagsResponse?.data || [];
  
  // Toggle featured mutation
  const { mutate: toggleFeaturedMutation } = useToggleHubFeatured();

  // Handle toggling featured status
  const handleToggleFeatured = (id: string, isFeatured: boolean) => {
    toggleFeaturedMutation({ id, isFeatured });
  };
  
  // Ensure type safety by casting to HubWithDetails[]
  const hubs = useMemo(() => {
    if (!hubsResponse?.data) return [];
    return hubsResponse.data as unknown as HubWithDetails[];
  }, [hubsResponse]);
  
  // First filter by featured status if needed
  const featuredFilteredHubs = useMemo(() => {
    return featuredOnly ? hubs.filter(hub => hub.is_featured) : hubs;
  }, [hubs, featuredOnly]);
  
  // Then filter by selected tag if needed
  const filteredHubs = useMemo(() => {
    if (!selectedTagId) return featuredFilteredHubs;
    
    // Get the set of hub IDs that have the selected tag
    const taggedHubIds = new Set(tagAssignments.map(ta => ta.target_id));
    
    // Filter hubs by tag ID
    const filteredByTag = featuredFilteredHubs.filter(hub => taggedHubIds.has(hub.id));
    
    logger.debug(`Filtered hubs by tag ${selectedTagId}: ${filteredByTag.length} out of ${featuredFilteredHubs.length}`);
    
    return filteredByTag;
  }, [featuredFilteredHubs, selectedTagId, tagAssignments]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <HubCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  
  // Add tag filter UI
  return (
    <div>
      <div className="mb-6 w-full md:max-w-xs">
        <TagFilter
          selectedTagId={selectedTagId}
          onTagSelect={setSelectedTagId}
          tags={tags}
          isLoading={isTagsLoading}
          targetType={EntityType.HUB}
          label="Filter Hubs by Tag"
        />
      </div>

      {filteredHubs.length === 0 ? (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {selectedTagId 
              ? 'No hubs match the selected tag' 
              : featuredOnly 
                ? 'No featured hubs available' 
                : 'No hubs available'}
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHubs.map(hub => (
            <HubCard 
              key={hub.id} 
              hub={hub} 
              isAdmin={isAdmin}
              onToggleFeatured={isAdmin ? handleToggleFeatured : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HubGrid;
