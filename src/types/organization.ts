
import { Entity } from './entity';
import { EntityType } from './entityTypes';
import { ProfileOrganizationRelationship } from './profile';

// Organization data from database
export interface Organization extends Entity {
  id: string;
  entityType: EntityType.ORGANIZATION;
  name: string;
  description: string;
  websiteUrl: string;
  logoUrl: string;
  logoApiUrl: string;
  isVerified: boolean;
  locationId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Organization form data
export interface OrganizationFormValues {
  name: string;
  description: string;
  websiteUrl?: string;
  logoUrl?: string;
  locationId?: string | null;
}

// Organization with relationships
export interface OrganizationWithRelationships extends Organization {
  relationships?: ProfileOrganizationRelationship[];
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
