
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useFeaturedHubs } from '@/hooks/hubs';
import HubCard from './HubCard';
import { HubWithDetails } from '@/types/hub';
import { Skeleton } from '@/components/ui/skeleton';

const FeaturedHubs: React.FC = () => {
  const { data: hubsResponse, isLoading } = useFeaturedHubs();
  
  // Cast to the correct type
  const featuredHubs = hubsResponse?.data as unknown as HubWithDetails[] || [];
  
  // Limit to showing 3 featured hubs on homepage
  const displayHubs = featuredHubs.slice(0, 3);

  return (
    <section className="py-12 bg-gray-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Featured Hubs</h2>
          <p className="mt-2 text-lg text-muted-foreground">
            Discover communities and resources around topics that matter to you
          </p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-[200px] w-full rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayHubs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayHubs.map(hub => (
              <HubCard key={hub.id} hub={hub} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No featured hubs available at this time.</p>
          </div>
        )}
        
        <div className="mt-10 text-center">
          <Button asChild size="lg">
            <Link to="/hubs">View All Hubs</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedHubs;
