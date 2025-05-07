export interface Location {
  id: string;
  city: string;
  region: string;
  country: string;
  full_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LocationWithDetails extends Location {
  formatted_location: string;
}

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
  role: "admin" | "member";
  location_id: string | null;
  company?: string | null;
  created_at?: string;
  updated_at?: string;
  is_approved?: boolean;
  membership_tier?: string;
}

export interface ProfileWithDetails extends Profile {
  full_name: string;
  location?: LocationWithDetails;
}

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  logo_api_url: string | null;
  created_at: string;
  updated_at?: string; 
  location_id: string | null;
  is_verified?: boolean | null;
}

export interface OrganizationWithLocation extends Organization {
  location?: LocationWithDetails;
}

// Rename OrganizationRelationship to ProfileOrganizationRelationship for consistency with existing code
export interface ProfileOrganizationRelationship {
  id: string;
  profile_id: string;
  organization_id: string;
  connection_type: "current" | "former" | "ally";
  department: string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string;
}

// Define the type being used in the components
export interface OrganizationRelationshipWithDetails extends ProfileOrganizationRelationship {
  organization: OrganizationWithLocation;
}

export interface ProfileOrganizationRelationshipWithDetails extends ProfileOrganizationRelationship {
  organization: OrganizationWithLocation;
}

export interface OrganizationAdmin {
  id: string;
  profile_id: string;
  organization_id: string;
  role: string;
  is_approved: boolean;
  created_at: string;
  updated_at?: string;
  can_edit_profile?: boolean;
}

export interface OrganizationAdminWithDetails extends OrganizationAdmin {
  profile: ProfileWithDetails;
  organization: OrganizationWithLocation;
}

export interface SupabaseListResult<T> {
  data: T[] | null;
  error: any;
}
