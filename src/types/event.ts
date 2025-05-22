
import { Entity } from './entity';
import { EntityType } from './entityTypes';

/**
 * Event entity type
 */
export interface Event extends Entity {
  entityType: EntityType.EVENT;
  title: string;
  description?: string;
  startTime: Date | null;
  endTime: Date | null;
  isVirtual: boolean;
  isPaid: boolean;
  price?: number | null;
  hostId?: string | null;
  locationId?: string | null;
  tagId?: string | null;
}

