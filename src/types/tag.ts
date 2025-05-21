
import { EntityType } from './entityTypes';

/**
 * Represents a tag entity
 */
export interface Tag {
  id: string;
  name: string;
  description?: string;
  type?: EntityType;
  created_at?: string;
  updated_at?: string;
}

/**
 * Tag assignment linking a tag to an entity
 */
export interface TagAssignment {
  id: string;
  tag_id: string;
  target_id: string;
  target_type: EntityType;
  created_at?: string;
  updated_at?: string;
}

/**
 * Tag assignment with tag details included
 */
export interface TagAssignmentWithDetails extends TagAssignment {
  tag?: Tag;
}
