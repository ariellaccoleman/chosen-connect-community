
import { Tag } from "./tags";

/**
 * Represents a Hub entity in the database
 */
export interface Hub {
  id: string;
  tag_id: string;
  name: string;
  description: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Extends Hub with tag details (from hub_details view)
 */
export interface HubWithTag extends Hub {
  tag_name: string;
  tag_description: string | null;
}

/**
 * Type for creating a new Hub
 */
export type CreateHubDto = Omit<Hub, 'id' | 'created_at' | 'updated_at'>;

/**
 * Type for updating an existing Hub
 */
export type UpdateHubDto = Partial<CreateHubDto>;
