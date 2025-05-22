
import { EntityType } from './entityTypes';

/**
 * Base entity interface
 * Common properties for all entities in the system
 */
export interface Entity {
  id: string;
  entityType: EntityType;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

