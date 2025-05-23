
import { Entity } from './entity';
import { EntityType } from './entityTypes';
import { TagAssignment } from '@/utils/tags/types';
import { Location } from './location';

/**
 * Profile type definition that matches the database structure
 */
export interface Profile {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  bio?: string;
  headline?: string;
  avatarUrl?: string;
  company?: string;
  websiteUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  timezone?: string;
  isApproved?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  locationId?: string;
  role?: 'admin' | 'member';  // Add role field
}

/**
 * Profile with additional details like location and tags
 */
export interface ProfileWithDetails extends Profile, Entity {
  entityType: EntityType.PERSON;
  fullName?: string;
  formattedLocation?: string;
  location?: Location;
  tags?: TagAssignment[];
  // Include role from auth metadata
  role?: 'admin' | 'member';
}

/**
 * Profile form values used in forms
 */
export interface ProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  headline?: string;
  bio?: string;
  company?: string;
  websiteUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  avatarUrl?: string;
  timezone?: string;
  locationId?: string;
}

/**
 * Organization relationship types
 */
export type ConnectionType = 'current' | 'former' | 'connected_insider';

/**
 * Profile-Organization relationship
 */
export interface ProfileOrganizationRelationship {
  id: string;
  profileId: string;
  organizationId: string;
  connectionType: ConnectionType;
  department?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Profile-Organization relationship with organization details
 */
export interface ProfileOrganizationRelationshipWithDetails extends ProfileOrganizationRelationship {
  organization?: {
    id: string;
    name: string;
    logoUrl?: string;
    location?: {
      id: string;
      city: string;
      region: string;
      country: string;
      formatted_location?: string;
    };
  };
}

/**
 * Configuration for profile filtering
 */
export interface ProfileFilters {
  search?: string;
  tags?: string[];
  showWithAvatar?: boolean;
}
