
import { Profile } from "./profile";
import { TagAssignment } from "@/utils/tags/types";

/**
 * Chat channel basic interface
 */
export interface ChatChannel {
  id: string;
  name: string | null;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  channel_type: 'group' | 'announcement';
  tag_assignments?: TagAssignment[]; // Add this property
}

/**
 * Chat channel with additional details
 */
export interface ChatChannelWithDetails extends ChatChannel {
  created_by_profile: Profile | null;
  tag_assignments: TagAssignment[];
}

/**
 * Chat channel create payload
 */
export interface ChatChannelCreate {
  name?: string;
  description?: string;
  is_public?: boolean;
  created_by?: string;
  channel_type?: 'group' | 'announcement';
}

/**
 * Chat channel update payload
 */
export interface ChatChannelUpdate {
  name?: string;
  description?: string;
  is_public?: boolean;
  channel_type?: 'group' | 'announcement';
}
