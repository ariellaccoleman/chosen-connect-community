
/**
 * Chat channel type
 */
export type ChatChannelType = 'group' | 'announcement';

/**
 * Base chat channel model
 */
export interface ChatChannel {
  id: string;
  name: string | null;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  channel_type: ChatChannelType;
}

/**
 * Chat channel create model
 */
export interface ChatChannelCreate {
  name: string;
  description?: string;
  is_public: boolean;
  channel_type: ChatChannelType;
}

/**
 * Chat channel update model
 */
export interface ChatChannelUpdate {
  name?: string;
  description?: string;
  is_public?: boolean;
  channel_type?: ChatChannelType;
}

/**
 * Chat channel with details
 */
export interface ChatChannelWithDetails extends ChatChannel {
  created_by_profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  tag_assignments?: any[];
}
