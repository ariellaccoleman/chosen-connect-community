
import { useMemo } from 'react';
import { EntityType } from '@/types/entityTypes';
import { Entity } from '@/types/entity';
import { APP_ROUTES } from '@/config/routes';
import { generatePath } from 'react-router-dom';
import { logger } from '@/utils/logger';

// Import from registry without relying on defaultEntityRegistrations export
import { entityRegistry } from '@/registry';

/**
 * Custom hook that provides access to the entity registry.
 * This allows us to dynamically render different entities based on their type
 * without needing to add conditional logic throughout the app.
 */
export const useEntityRegistry = () => {
  const registry = useMemo(() => entityRegistry, []);

  /**
   * Gets the URL for an entity
   */
  const getEntityUrl = (entity: Entity): string => {
    const registration = registry[entity.entityType];
    
    if (!registration) {
      logger.warn(`No registration found for entity type: ${entity.entityType}`);
      return '/';
    }
    
    // Generate the path using the configuration
    try {
      // For EVENT type, we need to use eventId as the parameter key to match APP_ROUTES.EVENT_DETAIL
      if (entity.entityType === EntityType.EVENT) {
        return generatePath(APP_ROUTES.EVENT_DETAIL, { eventId: entity.id });
      }
      
      // For PERSON type (formerly PROFILE), use profileId as the parameter key
      if (entity.entityType === EntityType.PERSON) {
        return generatePath(APP_ROUTES.PROFILE_VIEW, { profileId: entity.id });
      }
      
      // For ORGANIZATION type
      if (entity.entityType === EntityType.ORGANIZATION) {
        return generatePath(APP_ROUTES.ORGANIZATION_DETAIL, { orgId: entity.id });
      }
      
      // For HUB type
      if (entity.entityType === EntityType.HUB) {
        return generatePath(APP_ROUTES.HUB_DETAIL, { hubId: entity.id });
      }
      
      logger.warn(`No URL pattern defined for entity type: ${entity.entityType}`);
      return '/';
    } catch (e) {
      logger.error('Error generating entity URL:', e);
      return '/';
    }
  };

  /**
   * Gets the icon for an entity type
   */
  const getEntityIcon = (entityType: EntityType) => {
    const registration = registry[entityType];
    return registration ? registration.icon : null;
  };

  /**
   * Gets the label for an entity type
   */
  const getEntityTypeLabel = (entityType: EntityType): string => {
    const registration = registry[entityType];
    return registration ? registration.label : 'Unknown';
  };
  
  /**
   * Gets the plural label for an entity type
   */
  const getEntityTypePlural = (entityType: EntityType): string => {
    const registration = registry[entityType];
    return registration ? (registration.pluralLabel || `${registration.label}s`) : 'Unknown';
  };

  /**
   * Gets the avatar fallback for an entity
   */
  const getEntityAvatarFallback = (entity: Entity): string => {
    if (!entity.name) return '??';
    
    // Split by spaces and get first letters
    return entity.name
      .split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  };
  
  /**
   * Convert a data object to an entity
   */
  const toEntity = (data: any, entityType: EntityType): Entity | null => {
    if (!data) return null;
    
    const baseEntity: Entity = {
      id: data.id,
      entityType,
      name: '',
      created_at: data.created_at,
    };
    
    switch (entityType) {
      case EntityType.EVENT:
        return {
          ...baseEntity,
          name: data.title,
          description: data.description,
          location: data.location,
          imageUrl: data.image_url || null,
          tags: data.tags,
        };
      
      case EntityType.PERSON:
        return {
          ...baseEntity,
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          description: data.headline || data.bio,
          location: data.location,
          imageUrl: data.avatar_url || null,
          tags: data.tags,
        };
        
      case EntityType.ORGANIZATION:
        return {
          ...baseEntity,
          name: data.name,
          description: data.description,
          location: data.location,
          imageUrl: data.logo_url || data.logo_api_url || null,
          tags: data.tags,
        };
        
      case EntityType.HUB:
        return {
          ...baseEntity,
          name: data.name,
          description: data.description,
          imageUrl: null, // Hubs don't have images currently
          tags: data.tags,
        };
        
      default:
        return null;
    }
  };

  return {
    getEntityUrl,
    getEntityIcon,
    getEntityTypeLabel,
    getEntityTypePlural,
    getEntityAvatarFallback,
    toEntity
  };
};
