
import React from 'react';
import { useHubs } from '@/hooks/hubs';
import HubGrid from '@/components/hubs/HubGrid';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Hubs: React.FC = () => {
  const { data: hubs, isLoading, error } = useHubs();
  const { isAdmin } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-heading">Content Hubs</h1>
          <p className="text-muted-foreground mt-2">
            Explore our community content organized by topics
          </p>
        </div>
        
        {isAdmin && (
          <Link to="/admin/hubs" className="mt-4 sm:mt-0">
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Manage Hubs
            </Button>
          </Link>
        )}
      </div>
      
      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all">All Hubs</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <HubGrid 
            hubs={hubs} 
            isLoading={isLoading} 
            error={error} 
            enableAdminActions={isAdmin} 
          />
        </TabsContent>
        
        <TabsContent value="featured" className="mt-6">
          <HubGrid 
            hubs={hubs?.filter(hub => hub.is_featured)} 
            isLoading={isLoading} 
            error={error} 
            enableAdminActions={isAdmin} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Hubs;
