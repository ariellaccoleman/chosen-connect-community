
import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useHub } from '@/hooks/hubs';
import { EntityType } from '@/types/entityTypes';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel';
import { useEntityRegistry } from '@/hooks/useEntityRegistry';
import { useChatChannelsByTag } from '@/hooks/chat/useChatChannels';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import ChannelPreview from '@/components/chat/ChannelPreview';
import EntityFeed from '@/components/entities/EntityFeed';

const HubDetail = () => {
  const { hubId } = useParams<{ hubId: string }>();
  const navigate = useNavigate();
  const { data: hubResponse, isLoading, error } = useHub(hubId);
  const hub = hubResponse?.data;

  // If there's an error or no hub found, redirect to the hubs page
  useEffect(() => {
    if (error || (!isLoading && !hub)) {
      navigate('/hubs');
    }
  }, [hub, isLoading, error, navigate]);

  // Get chat channels associated with this hub's tag
  const { data: chatChannels = [], isLoading: chatChannelsLoading } = useChatChannelsByTag(hub?.tag_id);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!hub) return null; // Will redirect from the useEffect

  return (
    <>
      <Helmet>
        <title>{hub.name} Hub | CHOSEN Network</title>
      </Helmet>
      
      <div className="container mx-auto py-8 px-4">
        <div className="mb-2">
          <Button variant="ghost" asChild>
            <Link to="/hubs" className="flex items-center text-muted-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Hubs
            </Link>
          </Button>
        </div>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{hub.name} Hub</h1>
          {hub.description && (
            <p className="text-muted-foreground">{hub.description}</p>
          )}
        </div>
        
        <div className="space-y-8">
          {/* Display Chat Channels if available */}
          {chatChannels.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Chat Channels</h2>
              
              <Carousel className="w-full">
                <CarouselContent>
                  {chatChannels.map(channel => (
                    <CarouselItem key={`channel-${channel.id}`} className="md:basis-1/2 lg:basis-1/3">
                      <Card className="h-full transition-shadow hover:shadow-md">
                        <CardContent className="pt-6">
                          <CardTitle className="flex items-center">
                            <MessageSquare className="mr-2 h-5 w-5" />
                            {channel.name || "Unnamed Channel"}
                          </CardTitle>
                          {channel.description && (
                            <p className="text-muted-foreground mt-2 line-clamp-2">{channel.description}</p>
                          )}
                          
                          {/* Add the channel preview component */}
                          <ChannelPreview channel={channel} />
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex justify-end mt-4">
                  <CarouselPrevious className="relative static mr-2 -left-0 translate-y-0" />
                  <CarouselNext className="relative static -right-0 translate-y-0" />
                </div>
              </Carousel>
            </div>
          )}
          
          {/* Use the EntityFeed component to display related entities */}
          <div>
            <EntityFeed 
              title="Related Content" 
              tagId={hub.tag_id || undefined}
              showTabs={true}
              showTagFilter={false}
              excludeEntityTypes={[EntityType.HUB]} // Don't show other hubs in this feed
              emptyMessage={`No content associated with ${hub.name} yet`}
            />
          </div>
          
          {/* Loading state for entities */}
          {chatChannelsLoading && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HubDetail;
