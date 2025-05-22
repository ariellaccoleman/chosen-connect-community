
import React, { useEffect } from 'react';
import { useHubs } from '@/hooks/hubs';
import HubCard from './HubCard';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToggleHubFeatured } from '@/hooks/hubs/useHubHooks';
import { TagAssignment } from '@/utils/tags/types';
import { logger } from '@/utils/logger';

interface HubGridProps {
  isAdmin?: boolean;
  filterTagId?: string | null;
  tagAssignments?: TagAssignment[];
}

const HubGrid: React.FC<HubGridProps> = ({ 
  isAdmin = false,
  filterTagId = null,
  tagAssignments = []
}) => {
  const { data: hubs = [], isLoading, error, refetch } = useHubs();
  const { mutate: toggleFeatured } = useToggleHubFeatured();

  useEffect(() => {
    if (filterTagId) {
      logger.debug(`HubGrid: Filtering by tag ${filterTagId}`);
      logger.debug(`HubGrid: Have ${tagAssignments.length} tag assignments`);
    }
  }, [filterTagId, tagAssignments.length]);

  const handleToggleFeatured = (id: string, isFeatured: boolean) => {
    toggleFeatured({ id, isFeatured: !isFeatured });
  };

  // Filter hubs based on selected tag using the consistent approach
  const filteredHubs = filterTagId
    ? hubs.filter(hub => {
        // Get the set of IDs that have the selected tag
        const taggedIds = new Set(tagAssignments.map(ta => ta.target_id));
        // Return true if this hub's ID is in the set
        const isIncluded = taggedIds.has(hub.id);
        return isIncluded;
      })
    : hubs;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center text-red-600 mb-2">
          <AlertCircle size={20} className="mr-2" />
          <h3 className="font-medium">Error loading hubs</h3>
        </div>
        <p className="text-red-500 mb-4">{error instanceof Error ? error.message : "Failed to load hubs. Please try again later."}</p>
        <Button 
          variant="outline" 
          onClick={() => refetch()}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (filteredHubs.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          {filterTagId ? "No matching hubs found" : "No hubs available yet"}
        </h3>
        <p className="text-gray-600">
          {filterTagId 
            ? "Try selecting a different tag filter."
            : "Check back later for new hubs or contact an administrator."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredHubs.map((hub) => (
        <HubCard
          key={hub.id}
          hub={hub}
          isAdmin={isAdmin}
          onToggleFeatured={handleToggleFeatured}
        />
      ))}
    </div>
  );
};

export default HubGrid;
