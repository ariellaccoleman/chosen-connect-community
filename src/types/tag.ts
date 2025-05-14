
import { Database } from "@/integrations/supabase/types";

export type TagRecord = Database['public']['Tables']['tags']['Row'];
export type TagInsert = Database['public']['Tables']['tags']['Insert'];
export type TagUpdate = Database['public']['Tables']['tags']['Update'];

export interface Tag extends TagRecord {
  // Add any derived properties here
}

export type TagEntityType = {
  id: string;
  tag_id: string;
  entity_type: string;
  created_at: string;
  updated_at: string;
};

export type TagAssignment = {
  id: string;
  tag_id: string;
  target_id: string;
  target_type: string;
  created_at: string | null;
  updated_at: string | null;
  tag?: Tag;
};
