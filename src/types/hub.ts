
import { Tag } from './index';
import { EntityType } from './entityTypes';
import { Entity } from './entity';

/**
 * Hub type definition
 */
export interface Hub extends Entity {
  id: string;
  name: string;
  description: string | null;
  tag_id: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  entityType: EntityType.HUB;
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
