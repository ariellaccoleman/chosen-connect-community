import { useCallback, useMemo } from "react";
import { 
  Entity,
  profileToEntity,
  organizationToEntity, 
  eventToEntity
} from "@/types/entity";
import { EntityType } from "@/types/entityTypes";
import { ProfileWithDetails } from "@/types/profile";
import { OrganizationWithLocation } from "@/types/organization";
import { EventWithDetails } from "@/types/event";
import { Calendar, Users, Building2 } from "lucide-react";
import React from "react";

/**
 * Hook for working with different entity types in a consistent way
 */
export function useEntityRegistry() {
  /**
   * Convert any supported entity to the generic Entity interface
   */
  const toEntity = useCallback((entity: any, entityType: EntityType): Entity | null => {
    if (!entity) return null;
    
    switch (entityType) {
      case EntityType.PERSON:
        return profileToEntity(entity as ProfileWithDetails);
      case EntityType.ORGANIZATION:
        return organizationToEntity(entity as OrganizationWithLocation);
      case EntityType.EVENT:
        return eventToEntity(entity as EventWithDetails);
      default:
        console.warn(`Unsupported entity type: ${entityType}`);
        return null;
    }
  }, []);
  
  /**
   * Get the label for an entity type
   */
  const getEntityTypeLabel = useCallback((type: EntityType): string => {
    switch (type) {
      case EntityType.PERSON:
        return "Person";
      case EntityType.ORGANIZATION:
        return "Organization";
      case EntityType.EVENT:
        return "Event";
      default:
        return "Unknown";
    }
  }, []);
  
  /**
   * Get the plural form of an entity type label
   */
  const getEntityTypePlural = useCallback((type: EntityType): string => {
    switch (type) {
      case EntityType.PERSON:
        return "People";
      case EntityType.ORGANIZATION:
        return "Organizations";
      case EntityType.EVENT:
        return "Events";
      default:
        return "Items";
    }
  }, []);

  /**
   * Check if an entity is of a specific type
   */
  const isEntityType = useCallback((entity: Entity, type: EntityType): boolean => {
    return entity.entityType === type;
  }, []);
  
  /**
   * Filter entities by type
   */
  const filterEntitiesByType = useCallback((entities: Entity[], type: EntityType): Entity[] => {
    return entities.filter(entity => entity.entityType === type);
  }, []);
  
  /**
   * Get the URL for an entity
   */
  const getEntityUrl = useCallback((entity: Entity): string => {
    switch (entity.entityType) {
      case EntityType.PERSON:
        return `/profile/${entity.id}`;
      case EntityType.ORGANIZATION:
        return `/organizations/${entity.id}`;
      case EntityType.EVENT:
        return `/events/${entity.id}`;
      default:
        return "/";
    }
  }, []);
  
  /**
   * Get the icon for an entity type
   */
  const getEntityIcon = useCallback((type: EntityType): React.ReactNode => {
    switch (type) {
      case EntityType.PERSON:
        return <Users className="h-3 w-3" />;
      case EntityType.ORGANIZATION:
        return <Building2 className="h-3 w-3" />;
      case EntityType.EVENT:
        return <Calendar className="h-3 w-3" />;
      default:
        return null;
    }
  }, []);
  
  /**
   * Get the avatar fallback for an entity
   */
  const getEntityAvatarFallback = useCallback((entity: Entity): string => {
    if (!entity.name) return "?";
    return entity.name.substring(0, 2).toUpperCase();
  }, []);
  
  return {
    toEntity,
    getEntityTypeLabel,
    getEntityTypePlural,
    isEntityType,
    filterEntitiesByType,
    getEntityUrl,
    getEntityIcon,
    getEntityAvatarFallback
  };
}
