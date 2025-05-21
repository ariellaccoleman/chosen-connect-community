
// Updated Tag type to include entity_types
export interface Tag {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  entity_types?: string[]; // Added field to track associated entity types
}

export interface TagAssignment {
  id: string;
  tag_id: string;
  target_id: string;
  target_type: string;
  created_at?: string;
  updated_at?: string;
  tag?: Tag;
}

export interface TagEntityType {
  id: string;
  tag_id: string;
  entity_type: string;
  created_at?: string;
  updated_at?: string;
}
