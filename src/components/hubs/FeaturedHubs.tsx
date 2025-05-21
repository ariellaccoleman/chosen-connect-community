
import React from 'react';
import { Link } from 'react-router-dom';
import { useFeaturedHubs } from '@/hooks/hubs';
import HubGrid from './HubGrid';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

const FeaturedHubs: React.FC = () => {
  const { data: featuredHubs, isLoading, error } = useFeaturedHubs();
  
  // Don't show anything if there are no featured hubs or if there's an error
  if ((featuredHubs && featuredHubs.length === 0) || error) {
    return null;
  }
  
  return (
    <section className="py-12 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold font-heading">Featured Hubs</h2>
          <Link to="/hubs">
            <Button variant="ghost" className="flex items-center gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <HubGrid hubs={featuredHubs} isLoading={isLoading} error={error} />
      </div>
    </section>
  );
};

export default FeaturedHubs;
