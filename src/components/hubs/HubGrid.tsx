
import React, { useMemo } from 'react';
import HubCard from './HubCard';
import { useHubs, useToggleHubFeatured } from '@/hooks/hubs';
import { HubWithDetails } from '@/types/hub';
import { Skeleton } from '@/components/ui/skeleton';

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
  // Fetch all hubs
  const { data: hubsResponse, isLoading } = useHubs();
  
  // Toggle featured mutation
  const { mutate: toggleFeaturedMutation } = useToggleHubFeatured();

  // Handle toggling featured status
  const handleToggleFeatured = (id: string, isFeatured: boolean) => {
    toggleFeaturedMutation({ id, isFeatured });
  };
  
  // Ensure type safety by casting to HubWithDetails[]
  const hubs = useMemo(() => {
    if (!hubsResponse?.data) return [];
    return (hubsResponse.data as unknown as HubWithDetails[])
      .filter(hub => !featuredOnly || hub.is_featured);
  }, [hubsResponse, featuredOnly]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <HubCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (hubs.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
          {featuredOnly ? 'No featured hubs available' : 'No hubs available'}
        </h3>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {hubs.map(hub => (
        <HubCard 
          key={hub.id} 
          hub={hub} 
          isAdmin={isAdmin}
          onToggleFeatured={isAdmin ? handleToggleFeatured : undefined}
        />
      ))}
    </div>
  );
};

export default HubGrid;
