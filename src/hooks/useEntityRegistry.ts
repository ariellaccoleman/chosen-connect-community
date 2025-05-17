
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
  
  return {
    toEntity,
    getEntityTypeLabel,
    getEntityTypePlural,
    isEntityType,
    filterEntitiesByType
  };
}
