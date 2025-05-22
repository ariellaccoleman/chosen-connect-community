
import { useMemo } from 'react';
import { EntityType } from '@/types/entityTypes';
import { Entity } from '@/types/entity';
import { entityRegistry } from '@/registry/entityRegistrySystem';
import { logger } from '@/utils/logger';

/**
 * Hook that provides access to the consolidated entity registry system.
 * This replaces the previous useEntityRegistry hook with a more comprehensive
 * implementation that uses the unified registry.
 */
export const useEntitySystem = () => {
  const registry = useMemo(() => entityRegistry, []);

  // Get the URL for an entity
  const getEntityUrl = (entity: Entity): string => {
    if (!entity || !entity.entityType) {
      logger.warn('Invalid entity or missing entity type');
      return '/';
    }
    return registry.getEntityUrl(entity);
  };

  // Get the icon for an entity type
  const getEntityIcon = (entityType: EntityType) => {
    return registry.getEntityIcon(entityType);
  };

  // Get the label for an entity type
  const getEntityTypeLabel = (entityType: EntityType): string => {
    return registry.getEntityTypeLabel(entityType);
  };
  
  // Get the plural label for an entity type
  const getEntityTypePlural = (entityType: EntityType): string => {
    return registry.getEntityTypePlural(entityType);
  };

  // Get avatar fallback initials for an entity
  const getEntityAvatarFallback = (entity: Entity): string => {
    return registry.getEntityAvatarFallback(entity);
  };
  
  // Convert a data object to an entity
  const toEntity = (data: any, entityType: EntityType): Entity | null => {
    return registry.toEntity(data, entityType);
  };

  return {
    getEntityUrl,
    getEntityIcon,
    getEntityTypeLabel,
    getEntityTypePlural,
    getEntityAvatarFallback,
    toEntity,
    registry // Expose the registry instance for advanced usage
  };
};

// For backward compatibility
export const useEntityRegistry = useEntitySystem;
