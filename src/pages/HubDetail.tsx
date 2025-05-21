
import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useHub } from '@/hooks/hubs';
import Layout from '@/components/layout/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import ChannelPreview from '@/components/chat/ChannelPreview';
import PostCarousel from '@/components/posts/PostCarousel';
import { EntityType } from '@/types/entityTypes';
import { Shield } from 'lucide-react';
import { useEntityFeed } from '@/hooks/useEntityFeed';
import { EntityList } from '@/components/entities';
import { Badge } from '@/components/ui/badge';

const HubDetail = () => {
  const { hubId } = useParams<{ hubId: string }>();
  const { data: hub, isLoading, error } = useHub(hubId);
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Use the entity feed hook to get entities filtered by the hub's tag
  const {
    entities,
    isLoading: isEntitiesLoading,
  } = useEntityFeed({
    tagId: hub?.tag_id,
    entityTypes: [
      EntityType.PERSON,
      EntityType.ORGANIZATION,
      EntityType.EVENT,
    ],
  });
  
  // If the hub is loading, show a loading skeleton
  if (isLoading) {
    return (
      <Layout>
        <div className="container max-w-6xl mx-auto py-8">
          <Skeleton className="h-12 w-1/3 mb-4" />
          <Skeleton className="h-6 w-2/3 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </Layout>
    );
  }
  
  // If there's an error or the hub doesn't exist, redirect to the hubs list
  if (error || !hub) {
    return <Navigate to="/hubs" replace />;
  }
  
  return (
    <Layout>
      <div className="container max-w-6xl mx-auto py-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">{hub.name}</h1>
          {hub.is_featured && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Featured
            </Badge>
          )}
        </div>
        
        {hub.description && (
          <p className="text-muted-foreground mb-8">{hub.description}</p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <PostCarousel tagId={hub.tag_id} />
          <ChannelPreview tagId={hub.tag_id} />
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Hub Members</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 text-sm ${
                  activeTab === 'all'
                    ? 'bg-primary text-white rounded-full'
                    : 'text-muted-foreground'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('people')}
                className={`px-3 py-1 text-sm ${
                  activeTab === 'people'
                    ? 'bg-primary text-white rounded-full'
                    : 'text-muted-foreground'
                }`}
              >
                People
              </button>
              <button
                onClick={() => setActiveTab('organizations')}
                className={`px-3 py-1 text-sm ${
                  activeTab === 'organizations'
                    ? 'bg-primary text-white rounded-full'
                    : 'text-muted-foreground'
                }`}
              >
                Organizations
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-3 py-1 text-sm ${
                  activeTab === 'events'
                    ? 'bg-primary text-white rounded-full'
                    : 'text-muted-foreground'
                }`}
              >
                Events
              </button>
            </div>
          </div>
          
          <EntityList 
            entities={entities.filter(entity => {
              if (activeTab === 'all') return true;
              if (activeTab === 'people') return entity.entityType === EntityType.PERSON;
              if (activeTab === 'organizations') return entity.entityType === EntityType.ORGANIZATION;
              if (activeTab === 'events') return entity.entityType === EntityType.EVENT;
              return true;
            })} 
            isLoading={isEntitiesLoading}
          />
        </div>
      </div>
    </Layout>
  );
};

export default HubDetail;
