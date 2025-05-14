
import { entityRegistry } from "../registry";
import { EntityType } from "@/types/entityTypes";
import { Entity } from "@/types/entity";
import { EntityTypeDefinition } from "@/types/entityRegistry";
import { ReactNode } from "react";

export function useEntityRegistry() {
  // Get a registered entity type
  const getEntityTypeDefinition = (type: EntityType): EntityTypeDefinition | undefined => {
    return entityRegistry.get(type);
  };
  
  // Get the detail URL for an entity
  const getEntityUrl = (entity: Entity): string => {
    const definition = entityRegistry.get(entity.entityType);
    if (!definition) return "#";
    return definition.behavior.getDetailUrl(entity.id);
  };
  
  // Get the icon for an entity type
  const getEntityIcon = (entityType: EntityType): ReactNode | null => {
    const definition = entityRegistry.get(entityType);
    if (!definition) return null;
    return definition.behavior.getIcon();
  };
  
  // Get a label for an entity type
  const getEntityTypeLabel = (entityType: EntityType): string => {
    const definition = entityRegistry.get(entityType);
    if (!definition) return entityType;
    return definition.behavior.getTypeLabel();
  };
  
  // Get singular form of entity type name
  const getEntityTypeSingular = (entityType: EntityType): string => {
    const definition = entityRegistry.get(entityType);
    if (!definition) return entityType;
    return definition.behavior.getSingularName();
  };
  
  // Get plural form of entity type name
  const getEntityTypePlural = (entityType: EntityType): string => {
    const definition = entityRegistry.get(entityType);
    if (!definition) return `${entityType}s`;
    return definition.behavior.getPluralName();
  };
  
  // Get fallback text for avatar
  const getEntityAvatarFallback = (entity: Entity): string => {
    const definition = entityRegistry.get(entity.entityType);
    if (!definition) {
      // Default fallback if no definition exists
      if (!entity.name) return "?";
      return entity.name.substring(0, 2).toUpperCase();
    }
    return definition.behavior.getFallbackInitials(entity);
  };
  
  // Convert an entity of any type to the generic Entity interface
  const toEntity = (source: any, entityType: EntityType): Entity | null => {
    const definition = entityRegistry.get(entityType);
    if (!definition || !definition.converter.toEntity) return null;
    try {
      return definition.converter.toEntity(source);
    } catch (error) {
      console.error(`Error converting ${entityType} to Entity:`, error);
      return null;
    }
  };
  
  return {
    getEntityTypeDefinition,
    getEntityUrl,
    getEntityIcon,
    getEntityTypeLabel,
    getEntityTypeSingular,
    getEntityTypePlural,
    getEntityAvatarFallback,
    toEntity,
    getAllEntityTypes: () => entityRegistry.getAll(),
  };
}
