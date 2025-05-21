
import { EntityType } from './entityTypes';

/**
 * Represents a tag entity
 */
export interface Tag {
  id: string;
  name: string;
  description?: string | null;
  type?: EntityType | string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
}

/**
 * Tag assignment linking a tag to an entity
 */
export interface TagAssignment {
  id: string;
  tag_id: string;
  target_id: string;
  target_type: EntityType | string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Tag assignment with tag details included
 */
export interface TagAssignmentWithDetails extends TagAssignment {
  tag?: Tag;
}
