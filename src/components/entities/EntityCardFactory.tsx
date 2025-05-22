
import React from 'react';
import { EntityType } from '@/types/entityTypes';
import { Entity } from '@/types/entity';
import { entityRegistry } from '@/registry/entityRegistrySystem';
import EntityCard from './EntityCard';

interface EntityCardFactoryProps {
  entity: Entity;
  showTags?: boolean;
  className?: string;
}

/**
 * Factory component that creates entity cards based on entity type
 * Uses the unified entity registry to determine how to render each entity
 */
export const EntityCardFactory: React.FC<EntityCardFactoryProps> = ({ 
  entity, 
  showTags = true,
  className = "" 
}) => {
  // Get entity type definition from registry
  const definition = entityRegistry.get(entity.entityType);
  
  if (!definition) {
    return <EntityCard entity={entity} showTags={showTags} className={className} />;
  }
  
  // In the future, this could render different card implementations based on entity type
  return <EntityCard entity={entity} showTags={showTags} className={className} />;
};
