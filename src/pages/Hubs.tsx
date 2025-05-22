
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import HubGrid from '@/components/hubs/HubGrid';
import TagFilter from "@/components/filters/TagFilter";
import { EntityType } from "@/types/entityTypes";
import { useSelectionTags, useFilterByTag } from "@/hooks/tags";
import { logger } from "@/utils/logger";
import { Card } from '@/components/ui/card';

const Hubs: React.FC = () => {
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  
  // Use the tag hooks consistent with other pages
  const { data: tagsResponse, isLoading: isTagsLoading } = useSelectionTags(EntityType.HUB);
  const { data: tagAssignments = [] } = useFilterByTag(selectedTagId, EntityType.HUB);
  
  // Extract tags from the response
  const tags = tagsResponse?.data || [];
  
  // Debug tag filtering
  useEffect(() => {
    if (selectedTagId) {
      logger.debug("Hubs page - filtering by tag:", selectedTagId);
      logger.debug("Tag assignments:", tagAssignments);
    }
  }, [selectedTagId, tagAssignments]);

  return (
    <>
      <Helmet>
        <title>Hubs | CHOSEN Network</title>
      </Helmet>
      
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Hubs</h1>
          <p className="text-muted-foreground">
            Discover communities and resources organized by topics
          </p>
        </div>
        
        <Card className="p-6 mb-6">
          <div className="w-full md:max-w-xs">
            <TagFilter
              selectedTagId={selectedTagId}
              onTagSelect={setSelectedTagId}
              tags={tags}
              isLoading={isTagsLoading}
              label="Filter Hubs by Tags"
              targetType={EntityType.HUB}
            />
          </div>
        </Card>
        
        <HubGrid 
          filterTagId={selectedTagId} 
          tagAssignments={tagAssignments}
        />
      </div>
    </>
  );
};

export default Hubs;
