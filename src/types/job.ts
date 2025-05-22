
import { Entity } from "./entity";
import { Location } from "./location";

/**
 * Job post entity type
 */
export interface Job extends Entity {
  title: string;
  company: string;
  description: string;
  salary?: string;
  location?: Location; // Fixed: Changed from string to Location type
  remote?: boolean;
  applyUrl?: string;
  postedDate: string;
  closingDate?: string;
  status: 'open' | 'closed' | 'draft';
}

/**
 * Job post creation data
 */
export interface JobCreateData {
  title: string;
  company: string;
  description: string;
  salary?: string;
  location?: string | Location; // Allow string or Location for creation
  remote?: boolean;
  applyUrl?: string;
  closingDate?: string;
  status?: 'open' | 'closed' | 'draft';
}

/**
 * Job post update data
 */
export interface JobUpdateData {
  title?: string;
  company?: string;
  description?: string;
  salary?: string;
  location?: string | Location; // Allow string or Location for updates
  remote?: boolean;
  applyUrl?: string;
  closingDate?: string;
  status?: 'open' | 'closed' | 'draft';
}
