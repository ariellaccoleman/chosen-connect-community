
import { Entity } from "./entity";

/**
 * Job post entity type
 */
export interface Job extends Entity {
  title: string;
  company: string;
  description: string;
  salary?: string;
  location?: string;
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
  location?: string;
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
  location?: string;
  remote?: boolean;
  applyUrl?: string;
  closingDate?: string;
  status?: 'open' | 'closed' | 'draft';
}
