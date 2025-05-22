
import { Entity } from './entity';
import { EntityType } from './entityTypes';

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
