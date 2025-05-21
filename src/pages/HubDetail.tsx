
import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useHub } from '@/hooks/hubs';
import { EntityType } from '@/types/entityTypes';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MessageSquare, Calendar, Users, Building2 } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel';
import { useEntityFeed } from '@/hooks/useEntityFeed';
import { useChatChannelsByTag } from '@/hooks/chat/useChatChannels';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import ChannelPreview from '@/components/chat/ChannelPreview';
import EntityList from '@/components/entities/EntityList';
import { useEntityRegistry } from '@/hooks/useEntityRegistry';

const HubDetail = () => {
  const { hubId } = useParams<{ hubId: string }>();
  const navigate = useNavigate();
  const { data: hubResponse, isLoading, error } = useHub(hubId);
  const hub = hubResponse?.data;
  const { getEntityTypeLabel } = useEntityRegistry();

  // If there's an error or no hub found, redirect to the hubs page
  useEffect(() => {
    if (error || (!isLoading && !hub)) {
      navigate('/hubs');
    }
  }, [hub, isLoading, error, navigate]);

  // Get chat channels associated with this hub's tag
  const { data: chatChannels = [], isLoading: chatChannelsLoading } = useChatChannelsByTag(hub?.tag_id);
  
  // Use the entity feed hook for each entity type
  const { 
    entities: people, 
    isLoading: peopleLoading 
  } = useEntityFeed({
    entityTypes: [EntityType.PERSON],
    tagId: hub?.tag_id,
    limit: 6
  });
  
  const { 
    entities: organizations, 
    isLoading: organizationsLoading 
  } = useEntityFeed({
    entityTypes: [EntityType.ORGANIZATION],
    tagId: hub?.tag_id,
    limit: 6
  });
  
  const { 
    entities: events, 
    isLoading: eventsLoading 
  } = useEntityFeed({
    entityTypes: [EntityType.EVENT],
    tagId: hub?.tag_id,
    limit: 6
  });

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

  // Helper function to render an entity carousel
  const renderEntityCarousel = (title, entities, isLoading, icon) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      );
    }
    
    if (entities.length === 0) {
      return null;
    }
    
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
        </h2>
        <Carousel className="w-full">
          <CarouselContent>
            {entities.map(entity => (
              <CarouselItem key={`entity-${entity.id}`} className="md:basis-1/2 lg:basis-1/3">
                <EntityList 
                  entities={[entity]} 
                  isLoading={false} 
                  showTags={true}
                  className="h-full"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          {entities.length > 2 && (
            <div className="flex justify-end mt-4">
              <CarouselPrevious className="relative static mr-2 -left-0 translate-y-0" />
              <CarouselNext className="relative static -right-0 translate-y-0" />
            </div>
          )}
        </Carousel>
      </div>
    );
  };

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
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                <span>Chat Channels</span>
              </h2>
              
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
                {chatChannels.length > 2 && (
                  <div className="flex justify-end mt-4">
                    <CarouselPrevious className="relative static mr-2 -left-0 translate-y-0" />
                    <CarouselNext className="relative static -right-0 translate-y-0" />
                  </div>
                )}
              </Carousel>
            </div>
          )}
          
          {/* Render individual entity carousels */}
          {renderEntityCarousel("People", people, peopleLoading, <Users className="h-5 w-5" />)}
          {renderEntityCarousel("Organizations", organizations, organizationsLoading, <Building2 className="h-5 w-5" />)}
          {renderEntityCarousel("Events", events, eventsLoading, <Calendar className="h-5 w-5" />)}
          
          {/* Show message if no entities found */}
          {!peopleLoading && !organizationsLoading && !eventsLoading && 
           people.length === 0 && organizations.length === 0 && events.length === 0 && (
            <div className="text-center p-8 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-500">No content associated with {hub.name} yet</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HubDetail;
