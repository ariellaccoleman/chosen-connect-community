
import React from 'react';
import { Entity } from '@/types/entity';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel';
import EntityCard from '@/components/entities/EntityCard';
import { LucideIcon } from 'lucide-react';

interface EntityCarouselProps {
  title: string;
  entities: Entity[];
  isLoading: boolean;
  icon: React.ReactNode;
}

/**
 * Reusable carousel component for displaying entities in the hub detail page
 */
const EntityCarousel: React.FC<EntityCarouselProps> = ({ 
  title, 
  entities, 
  isLoading, 
  icon 
}) => {
  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
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
        <CarouselContent className="-ml-4 overflow-visible">
          {entities.map((entity) => (
            <CarouselItem key={`entity-${entity.id}`} className="pl-4 md:basis-2/5 lg:basis-2/7 pr-4">
              <div className="h-full">
                <EntityCard entity={entity} showTags={true} className="h-full" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {entities.length > 1 && (
          <div className="flex justify-end mt-2">
            <CarouselPrevious className="mr-2 static translate-y-0 left-auto" />
            <CarouselNext className="static translate-y-0 right-auto" />
          </div>
        )}
      </Carousel>
    </div>
  );
};

export default EntityCarousel;
