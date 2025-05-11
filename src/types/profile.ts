
import { LocationWithDetails } from "./location";

export type MembershipTier = "free" | "community" | "pro" | "partner";

export interface Profile {
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
}

export interface ProfileWithDetails extends Profile {
  full_name: string;
  role?: "admin" | "member"; // Keep for compatibility with user.user_metadata.role
  location?: LocationWithDetails;
}
