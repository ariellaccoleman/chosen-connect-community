
import { LocationWithDetails } from "./location";
import { ProfileWithDetails } from "./profile";

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

export interface ProfileOrganizationRelationship {
  id: string;
  profile_id: string;
  organization_id: string;
  connection_type: "current" | "former" | "connected_insider";
  department: string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string;
}

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
