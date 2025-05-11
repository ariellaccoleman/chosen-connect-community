
/**
 * Type definitions for tag-related entities
 */

export type Tag = {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  is_public: boolean;
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

export const TAG_TYPES = {
  PERSON: "person",
  ORGANIZATION: "organization",
};
