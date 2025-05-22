
import { Tag } from './index';
import { Entity } from './entity';
import { EntityType } from './entityTypes';

/**
 * Hub type definition
 */
export interface Hub extends Entity {
  id: string;
  name: string;
  entityType: EntityType.HUB;
  description: string | null;
  tag_id: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Hub with additional tag details
 */
export interface HubWithDetails extends Hub {
  tag?: {
    id: string;
    name: string;
    description: string | null;
  };
}

/**
 * Hub form values for create/edit forms
 */
export interface HubFormValues {
  name: string;
  description?: string;
  tag_id?: string;
  is_featured?: boolean;
}
