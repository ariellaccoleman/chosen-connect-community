
import React from 'react';
import HubCard from './HubCard';
import { useHubMutations } from '@/hooks/hubs';
import { HubWithTag } from '@/types/hub';
import { Skeleton } from '@/components/ui/skeleton';

interface HubGridProps {
  hubs: HubWithTag[] | undefined;
  isLoading: boolean;
  error: unknown;
  enableAdminActions?: boolean;
}

const HubGrid: React.FC<HubGridProps> = ({ 
  hubs,
  isLoading,
  error,
  enableAdminActions = false
}) => {
  const { toggleFeatured, isTogglingFeatured } = useHubMutations();
  
  // Handle loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="flex flex-col">
            <Skeleton className="h-40" />
            <Skeleton className="h-4 w-1/2 mt-4" />
            <Skeleton className="h-3 w-3/4 mt-2" />
            <Skeleton className="h-8 mt-4" />
          </div>
        ))}
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded bg-red-50 text-red-700 my-4">
        <p>Error loading hubs: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
  
  // Handle empty state
  if (!hubs || hubs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No hubs available.</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {hubs.map((hub) => (
        <HubCard 
          key={hub.id}
          hub={hub}
          onToggleFeatured={enableAdminActions ? toggleFeatured : undefined}
          isTogglingFeatured={isTogglingFeatured}
        />
      ))}
    </div>
  );
};

export default HubGrid;
