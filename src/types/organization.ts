
import { Entity, EntityCreateInput, EntityUpdateInput } from "./entity";
import { EntityType } from "./entityTypes";
import { Location } from "./location";
import { Profile } from "./profile";

/**
 * Organization entity interface
 */
export interface Organization extends Entity {
  /**
   * Name of the organization
   */
  name: string;
  
  /**
   * Description of the organization
   */
  description?: string;
  
  /**
   * Organization's website URL
   */
  websiteUrl?: string;
  
  /**
   * URL to the organization's logo
   */
  logoUrl?: string;
  
  /**
   * URL to the organization's logo in API format
   */
  logoApiUrl?: string;
  
  /**
   * Whether the organization is verified
   */
  isVerified?: boolean;
  
  /**
   * ID of the organization's location
   */
  locationId?: string | null;
  
  /**
   * Location details
   */
  location?: Location;
  
  /**
   * Creation timestamp
   */
  createdAt?: Date;
  
  /**
   * Last updated timestamp
   */
  updatedAt?: Date;
  
  /**
   * Organization's entity type (always ORGANIZATION)
   */
  entityType: EntityType.ORGANIZATION;
}

/**
 * Organization with administrators
 */
export interface OrganizationWithAdmins extends Organization {
  /**
   * Administrators of the organization
   */
  admins?: OrganizationAdmin[];
}

/**
 * Organization administrator
 */
export interface OrganizationAdmin {
  /**
   * ID of the admin record
   */
  id: string;
  
  /**
   * ID of the organization
   */
  organization_id?: string;
  
  /**
   * ID of the profile
   */
  profile_id?: string;
  
  /**
   * Admin role (owner, editor, etc.)
   */
  role?: string;
  
  /**
   * Whether the admin is approved
   */
  is_approved?: boolean;
  
  /**
   * Whether the admin can edit the profile
   */
  can_edit_profile?: boolean;
  
  /**
   * Profile details
   */
  profile?: Profile;
}

/**
 * Organization admin with additional details
 */
export interface OrganizationAdminWithDetails extends OrganizationAdmin {
  /**
   * Organization details
   */
  organization?: Organization;
}

/**
 * Input for creating a new organization
 */
export interface OrganizationCreateInput extends EntityCreateInput {
  name: string;
  description?: string;
  websiteUrl?: string;
  logoUrl?: string;
  locationId?: string | null;
}

/**
 * Input for updating an organization
 */
export interface OrganizationUpdateInput extends EntityUpdateInput {
  name?: string;
  description?: string;
  websiteUrl?: string;
  logoUrl?: string;
  isVerified?: boolean;
  locationId?: string | null;
}
