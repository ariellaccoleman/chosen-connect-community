
import { Entity } from './entity';
import { EntityType } from './entityTypes';

/**
 * Hub entity type
 */
export interface Hub extends Entity {
  entityType: EntityType.HUB;
  description?: string;
  tagId?: string | null;
  isFeatured: boolean;
}

