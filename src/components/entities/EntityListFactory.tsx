
import React from 'react';
import { EntityType } from '@/types/entityTypes';
import { Entity } from '@/types/entity';
import EntityList from './EntityList';

interface EntityListFactoryProps {
  entities: Entity[];
  entityType?: EntityType;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  showTags?: boolean;
}

/**
 * Factory component that creates entity lists based on entity type
 * Uses the unified entity registry to determine how to render each entity list
 */
export const EntityListFactory: React.FC<EntityListFactoryProps> = ({ 
  entities, 
  entityType,
  isLoading = false,
  emptyMessage,
  className = "",
  showTags = true
}) => {
  // For now, just use the standard EntityList component
  // In the future, we could have specialized lists for different entity types
  return (
    <EntityList 
      entities={entities}
      isLoading={isLoading}
      emptyMessage={emptyMessage || (entityType ? `No ${entityType}s found` : 'No items found')}
      className={className}
      showTags={showTags}
    />
  );
};
