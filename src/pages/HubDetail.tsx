
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useHub } from '@/hooks/hubs';
import { EntityType } from '@/types/entityTypes';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Building2, Calendar } from 'lucide-react';
import { useEntityFeed } from '@/hooks/useEntityFeed';
import { useChatChannelsByTag } from '@/hooks/chat/useChatChannels';
import { logger } from '@/utils/logger';
import PostCarousel from '@/components/feed/PostCarousel';
import ChatChannelCarousel from '@/components/hubs/detail/ChatChannelCarousel';
import EntityCarousel from '@/components/hubs/detail/EntityCarousel';
import HubHeader from '@/components/hubs/detail/HubHeader';
import EmptyHubState from '@/components/hubs/detail/EmptyHubState';

const HubDetail = () => {
  const { hubId } = useParams<{ hubId: string }>();
  const navigate = useNavigate();
  const { data: hubResponse, isLoading, error } = useHub(hubId);
  const hub = hubResponse?.data;

  // Log hub details for debugging
  useEffect(() => {
    if (hub) {
      logger.debug('Hub detail loaded:', {
        id: hub.id,
        name: hub.name,
        tag_id: hub.tag_id
      });
    }
  }, [hub]);

  // If there's an error or no hub found, redirect to the hubs page
  useEffect(() => {
    if (error || (!isLoading && !hub)) {
      logger.error('Hub not found or error occurred:', error);
      navigate('/hubs');
    }
  }, [hub, isLoading, error, navigate]);

  // Get chat channels associated with this hub's tag
  const { data: chatChannels = [], isLoading: chatChannelsLoading } = useChatChannelsByTag(hub?.tag_id);
  
  // Enhanced logging to debug tag filtering
  useEffect(() => {
    if (hub?.tag_id) {
      logger.debug(`Using tag_id for filtering: ${hub.tag_id}`);
    }
  }, [hub?.tag_id]);

  // Use the improved entity feed hook for each entity type with the proper tag_id
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

  // Log entity counts for debugging
  useEffect(() => {
    if (hub) {
      logger.debug(`Entity counts for hub ${hub.name}:`, {
        people: people.length,
        organizations: organizations.length,
        events: events.length,
        tag_id: hub.tag_id
      });
    }
  }, [hub, people, organizations, events]);

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

  const hasEntities = people.length > 0 || organizations.length > 0 || events.length > 0;
  
  // Log the check for entities
  logger.debug(`Hub ${hub.name} has entities: ${hasEntities}`, {
    peopleCount: people.length,
    organizationsCount: organizations.length,
    eventsCount: events.length,
    tagId: hub?.tag_id
  });

  return (
    <>
      <Helmet>
        <title>{hub?.name} Hub | CHOSEN Network</title>
      </Helmet>
      
      <div className="container mx-auto py-8 px-4">
        <HubHeader hub={hub} />
        
        <div className="space-y-8">
          {/* Posts Carousel */}
          <PostCarousel tagId={hub?.tag_id} />
          
          {/* Display Chat Channels if available */}
          <ChatChannelCarousel 
            channels={chatChannels} 
            isLoading={chatChannelsLoading}
          />
          
          {/* Render individual entity carousels */}
          {people.length > 0 && (
            <EntityCarousel 
              title="People"
              entities={people}
              isLoading={peopleLoading}
              icon={<Users className="h-5 w-5" />}
            />
          )}
          
          {organizations.length > 0 && (
            <EntityCarousel 
              title="Organizations"
              entities={organizations}
              isLoading={organizationsLoading}
              icon={<Building2 className="h-5 w-5" />}
            />
          )}
          
          {events.length > 0 && (
            <EntityCarousel 
              title="Events"
              entities={events}
              isLoading={eventsLoading}
              icon={<Calendar className="h-5 w-5" />}
            />
          )}
          
          {/* Show message if no entities found */}
          {!peopleLoading && !organizationsLoading && !eventsLoading && !hasEntities && (
            <EmptyHubState hubName={hub?.name} />
          )}
        </div>
      </div>
    </>
  );
};

export default HubDetail;
