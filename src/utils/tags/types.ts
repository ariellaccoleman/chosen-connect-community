
import { EntityType } from "@/types/entityTypes";

/**
 * Tag model representing a single tag
 */
export interface Tag {
  id: string;
  name: string;
  type?: string | EntityType;
  description?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Tag assignment model representing a tag assigned to an entity
 */
export interface TagAssignment {
  id: string;
  tag_id: string;
  target_id: string;
  target_type: string | EntityType;
  created_at?: string;
  updated_at?: string;
  tag?: Tag;
}

/**
 * Tag entity type model representing a tag's association with an entity type
 */
export interface TagEntityType {
  id: string;
  tag_id: string;
  entity_type: string | EntityType;
  created_at?: string;
  updated_at?: string;
}
