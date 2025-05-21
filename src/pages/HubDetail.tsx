
import React from 'react';
import { useParams } from 'react-router-dom';
import { useHub } from '@/hooks/hubs';
import { APP_ROUTES } from '@/config/routes';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChannelPreview from '@/components/chat/ChannelPreview';
import EntityFeed from '@/components/entities/EntityFeed';
import { EntityType } from '@/types/entityTypes';

const HubDetail = () => {
  const { hubId } = useParams<{ hubId: string }>();
  const { data, isLoading } = useHub(hubId);
  
  // Access the hub data safely
  const hub = data?.data;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4 max-w-md" />
          <Skeleton className="h-6 w-1/2" />
          <div className="mt-8">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!hub) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">Hub not found</h2>
          <p className="text-muted-foreground">The hub you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{hub.name}</h1>
        {hub.description && (
          <p className="text-lg text-muted-foreground">{hub.description}</p>
        )}
      </header>
      
      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="feed">Activity</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="feed" className="space-y-8">
          <EntityFeed
            title="Hub Activity"
            tagId={hub.tag_id || undefined}
            showTagFilter={false}
            excludeEntityTypes={[EntityType.HUB]}
            emptyMessage="No activity in this hub yet"
          />
        </TabsContent>
        
        <TabsContent value="resources" className="space-y-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Curated Resources</h2>
            <p className="text-muted-foreground">Coming soon: Curated resources related to this hub.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="discussions" className="space-y-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Hub Discussions</h2>
            {hub.tag_id ? (
              <ChannelPreview
                id={hub.tag_id}
                name={`${hub.name} Discussions`}
                description="Join the conversation in this hub"
                lastMessage="Start chatting with other members"
              />
            ) : (
              <p className="text-muted-foreground">No discussion channels available for this hub.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HubDetail;
