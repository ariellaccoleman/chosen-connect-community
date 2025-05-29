
import React from 'react';
import { EntityType } from '@/types/entityTypes';
import { Entity } from '@/types/entity';
import { entityRegistry } from '@/registry/entityRegistrySystem';
import EntityCard from './EntityCard';
import ProfileCard from '@/components/community/ProfileCard';
import OrganizationCard from '@/components/organizations/OrganizationCard';
import EventCard from '@/components/events/EventCard';
import { useEntitySystem } from '@/hooks/useEntitySystem';
import { useNavigate, generatePath } from 'react-router-dom';
import { APP_ROUTES } from '@/config/routes';

interface EntityCardFactoryProps {
  entity: Entity;
  showTags?: boolean;
  className?: string;
}

/**
 * Factory component that creates entity cards based on entity type
 * Routes to specialized card components for better presentation
 */
export const EntityCardFactory: React.FC<EntityCardFactoryProps> = ({ 
  entity, 
  showTags = true,
  className = "" 
}) => {
  const navigate = useNavigate();
  
  // Get entity type definition from registry
  const definition = entityRegistry.get(entity.entityType);
  
  if (!definition) {
    return <EntityCard entity={entity} showTags={showTags} className={className} />;
  }
  
  // Route to specialized cards based on entity type
  switch (entity.entityType) {
    case EntityType.PERSON:
      // Convert Entity to ProfileWithDetails format for ProfileCard
      const profileData = {
        ...entity,
        first_name: entity.name.split(' ')[0] || '',
        last_name: entity.name.split(' ').slice(1).join(' ') || '',
        // Map other entity fields to profile fields as needed
        bio: entity.description || '',
        avatar_url: entity.imageUrl || '',
        headline: (entity as any).headline || '',
        company: (entity as any).company || '',
        website_url: (entity as any).website_url || '',
        linkedin_url: (entity as any).linkedin_url || '',
        twitter_url: (entity as any).twitter_url || '',
        email: (entity as any).email || '',
        location_id: entity.location?.id || null,
        timezone: (entity as any).timezone || 'UTC',
        membership_tier: (entity as any).membership_tier || 'free',
        is_approved: (entity as any).is_approved ?? true,
        created_at: entity.created_at || new Date().toISOString(),
        updated_at: entity.updated_at || new Date().toISOString()
      };
      
      return <ProfileCard profile={profileData} />;
      
    case EntityType.ORGANIZATION:
      const handleOrgClick = () => {
        const orgDetailUrl = generatePath(APP_ROUTES.ORGANIZATION_DETAIL, { orgId: entity.id });
        navigate(orgDetailUrl);
      };
      
      return (
        <OrganizationCard 
          organization={entity} 
          onClick={handleOrgClick}
        />
      );
      
    case EntityType.EVENT:
      const handleEventView = (eventId: string) => {
        const eventUrl = generatePath(APP_ROUTES.EVENT_DETAIL, { eventId });
        navigate(eventUrl);
      };
      
      return (
        <EventCard 
          event={entity} 
          onViewEvent={handleEventView}
        />
      );
      
    default:
      // Fall back to generic EntityCard for other types
      return <EntityCard entity={entity} showTags={showTags} className={className} />;
  }
};
