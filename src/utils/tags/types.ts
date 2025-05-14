
/**
 * Type definitions for tag-related entities
 */
import { EntityType } from "@/types/entityTypes";

export type Tag = {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TagAssignment = {
  id: string;
  tag_id: string;
  target_id: string;
  target_type: string;
  created_at: string;
  updated_at: string;
  tag?: Tag;
};

export type TagEntityType = {
  id: string;
  tag_id: string;
  entity_type: string;
  created_at: string;
  updated_at: string;
};

/**
 * Map of entity types to their database representation
 * This helps when converting between EntityType enum and string values
 */
export const ENTITY_TYPE_MAP = {
  [EntityType.PERSON]: "person",
  [EntityType.ORGANIZATION]: "organization",
  [EntityType.EVENT]: "event",
};

/**
 * Legacy types for backward compatibility
 * @deprecated Use EntityType instead
 */
export const TAG_TYPES = {
  PERSON: "person",
  ORGANIZATION: "organization",
  EVENT: "event",
};
