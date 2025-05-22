
import { Entity } from './entity';
import { EntityType } from './entityTypes';
import { OrganizationRelationship } from './relationships';

// Organization data from database
export interface Organization extends Entity {
  id: string;
  entityType: EntityType.ORGANIZATION;
  name: string;
  description: string;
  website_url: string;
  logo_url: string;
  logo_api_url: string;
  is_verified: boolean;
  location_id: string | null;
  created_at: string;
  updated_at: string;
}

// Organization form data
export interface OrganizationFormValues {
  name: string;
  description: string;
  website_url?: string;
  logo_url?: string;
  location_id?: string | null;
}

// Organization with relationships
export interface OrganizationWithRelationships extends Organization {
  relationships?: OrganizationRelationship[];
}

// Organization with location details
export interface OrganizationWithLocation extends Organization {
  location?: {
    id: string;
    city: string;
    region: string;
    country: string;
  };
}

// Connection type for organization relationships
export enum ConnectionType {
  MEMBER = 'member',
  EMPLOYEE = 'employee',
  ADVISOR = 'advisor',
  INVESTOR = 'investor',
  PARTNER = 'partner',
  VOLUNTEER = 'volunteer',
  OTHER = 'other'
}
