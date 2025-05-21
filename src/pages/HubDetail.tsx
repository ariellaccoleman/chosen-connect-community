
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useHub } from '@/hooks/hubs';
import { EntityType } from '@/types/entityTypes';
import { Entity } from '@/types/entity';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { useEntityFeed } from '@/hooks/useEntityFeed';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel';
import EntityCard from '@/components/entities/EntityCard';
import { useEntityRegistry } from '@/hooks/useEntityRegistry';

const HubDetail = () => {
  const { hubId } = useParams<{ hubId: string }>();
  const navigate = useNavigate();
  const { data: hubResponse, isLoading, error } = useHub(hubId);
  const hub = hubResponse?.data;
  const { getEntityTypePlural } = useEntityRegistry();

  // If there's an error or no hub found, redirect to the hubs page
  useEffect(() => {
    if (error || (!isLoading && !hub)) {
      navigate('/hubs');
    }
  }, [hub, isLoading, error, navigate]);

  // Get all entity types to show in separate carousels
  const entityTypes = Object.values(EntityType);

  // Use the entity feed hook once with all entity types
  const { entities, isLoading: entitiesLoading } = useEntityFeed({
    entityTypes,
    tagId: hub?.tag_id || null
  });

  // Group entities by type
  const entitiesByType = entityTypes.reduce((acc, type) => {
    acc[type] = entities.filter(entity => entity.entityType === type);
    return acc;
  }, {} as Record<EntityType, Entity[]>);

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
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{hub.name} Hub</h1>
          {hub.description && (
            <p className="text-muted-foreground">{hub.description}</p>
          )}
        </div>
        
        <div className="space-y-12">
          {/* Map through entity types and create a carousel for each type with content */}
          {entityTypes.map(type => {
            const typeEntities = entitiesByType[type] || [];
            
            // Only show carousel if there are entities of this type
            if (typeEntities.length === 0) return null;
            
            return (
              <div key={type} className="mb-8">
                <h2 className="text-2xl font-bold mb-4">{getEntityTypePlural(type)}</h2>
                
                <Carousel className="w-full">
                  <CarouselContent>
                    {typeEntities.map(entity => (
                      <CarouselItem key={`${entity.entityType}-${entity.id}`} className="md:basis-1/2 lg:basis-1/3">
                        <EntityCard entity={entity} showTags={true} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div className="flex justify-end mt-4">
                    <CarouselPrevious className="relative static mr-2 -left-0 translate-y-0" />
                    <CarouselNext className="relative static -right-0 translate-y-0" />
                  </div>
                </Carousel>
              </div>
            );
          })}
          
          {/* Show message if no entities found at all */}
          {!entitiesLoading && Object.values(entitiesByType).every(list => list.length === 0) && (
            <div className="text-center p-8 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-500">No content associated with {hub.name} yet</p>
            </div>
          )}
          
          {/* Loading state for entities */}
          {entitiesLoading && (
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
