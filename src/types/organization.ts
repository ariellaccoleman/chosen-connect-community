import { LocationWithDetails } from "./location";
import { ProfileWithDetails } from "./profile";
import { TagAssignment } from "@/utils/tags";
import { EntityType } from "./entityTypes";
import { Entity } from "./entity";

export type ConnectionType = "current" | "former" | "connected_insider";

// Update Organization to match Entity interface requirements
export interface Organization extends Entity {
  id: string;
  entityType: EntityType.ORGANIZATION;
  name: string;
  description?: string;
  website_url?: string;
  logo_url?: string;
  logo_api_url?: string;
  location_id?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export type OrganizationWithLocation = Organization & {
  location?: LocationWithDetails;
  tags?: TagAssignment[];
};

export interface ProfileOrganizationRelationship {
  id: string;
  profile_id: string;
  organization_id: string;
  connection_type: ConnectionType;
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
