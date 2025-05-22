
import { Entity } from './entity';
import { EntityType } from './entityTypes';

/**
 * Organization entity type
 */
export interface Organization extends Entity {
  entityType: EntityType.ORGANIZATION;
  description?: string;
  websiteUrl?: string;
  logoUrl?: string;
  logoApiUrl?: string;
  isVerified: boolean;
  locationId?: string | null;
}

