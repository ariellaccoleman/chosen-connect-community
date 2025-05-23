
import { LocationWithDetails } from "./location";
import { TagAssignment } from "@/utils/tags/types";
import { Entity } from "./entity";
import { EntityType } from "./entityTypes";

export type MembershipTier = "free" | "community" | "pro" | "partner";

export interface Profile extends Entity {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  location_id: string | null;
  company?: string | null;
  created_at?: string;
  updated_at?: string;
  is_approved?: boolean;
  membership_tier?: MembershipTier;
  entityType: EntityType.PERSON;
  name: string; // Will be derived from first_name + last_name
  
  // Add additional fields for compatibility with component usage
  full_name?: string;
}

export interface ProfileWithDetails extends Profile {
  full_name: string;
  role?: "admin" | "member"; // Keep for compatibility with user.user_metadata.role
  location?: LocationWithDetails;
  tags?: TagAssignment[]; // Add tags property
}
