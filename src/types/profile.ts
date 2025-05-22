
import { Entity } from './entity';
import { EntityType } from './entityTypes';

/**
 * Profile entity type
 */
export interface Profile extends Entity {
  entityType: EntityType.PERSON;
  firstName: string;
  lastName: string;
  email: string;
  bio?: string;
  headline?: string;
  avatarUrl?: string;
  company?: string;
  websiteUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  timezone: string;
  isApproved: boolean;
  membershipTier?: string;
  locationId?: string | null;
}

