
import { Entity } from './entity';
import { EntityType } from './entityTypes';
import { LocationWithDetails } from './location';
import { TagAssignment } from '@/utils/tags/types';

// User profile data from database
export interface Profile extends Entity {
  id: string;
  firstName: string;
  lastName: string;
  entityType: EntityType.PERSON;
  name: string; // Concatenated firstName + lastName to satisfy Entity interface
  email: string;
  bio: string;
  headline: string;
  avatarUrl: string;
  company: string;
  websiteUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  timezone: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Profile with additional details like location and relationships
export interface ProfileWithDetails extends Profile {
  location?: LocationWithDetails;
  tags?: TagAssignment[];
  // Format the name for display
  fullName?: string;
  formattedLocation?: string;
}

// Organization form data
export interface ProfileFormValues {
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
  timezone?: string;
}

// Public profile display data
export interface PublicProfile {
  id: string;
  fullName: string;
  avatarUrl?: string;
  headline?: string;
  bio?: string;
  company?: string;
  websiteUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
}

// Membership tier for user profiles
export enum MembershipTier {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

// Organization relationship types 
export interface ProfileOrganizationRelationship {
  id: string;
  profileId: string;
  organizationId: string;
  connectionType: string;
  department?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Organization relationship with details
export interface ProfileOrganizationRelationshipWithDetails extends ProfileOrganizationRelationship {
  organization?: {
    id: string;
    name: string;
    logoUrl?: string;
  }
}

// Organization admin with details
export interface OrganizationAdminWithDetails {
  id: string;
  profileId: string;
  organizationId: string;
  role: string;
  isApproved: boolean;
  canEditProfile: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: {
    id: string;
    firstName: string;
    lastName: string;
    fullName?: string;
    email: string;
    avatarUrl?: string;
  }
}
