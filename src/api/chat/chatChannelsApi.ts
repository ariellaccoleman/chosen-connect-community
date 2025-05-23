import { createApiFactory } from '../core/factory/apiFactory';
import { ChatChannel, ChatChannelCreate, ChatChannelUpdate, ChatChannelWithDetails } from '@/types/chat';
import { apiClient } from '../core/apiClient';
import { EntityType } from '@/types/entityTypes';
import { createSuccessResponse, ApiResponse, createErrorResponse } from '../core/errorHandler';
import { logger } from '@/utils/logger';
import { createRepository } from '../core/repository/repositoryFactory';
import { Tables } from '@/integrations/supabase/types';
import { Profile } from '@/types/profile';
import { TagAssignment } from '@/utils/tags/types';

type ChatChannelRow = Tables<"chat_channels">;

/**
 * Create API operations for chat channels using the factory pattern
 */
export const chatChannelsApi = createApiFactory<ChatChannel, string, ChatChannelCreate, ChatChannelUpdate>({
  tableName: 'chat_channels',
  entityName: 'chatChannel',
  defaultOrderBy: 'created_at',
  transformResponse: (data: ChatChannelRow) => ({
    id: data.id,
    name: data.name || null,
    description: data.description || null,
    is_public: data.is_public !== false, // Default to true if null
    created_at: data.created_at || '',
    updated_at: data.updated_at || data.created_at || '',
    created_by: data.created_by || null,
    channel_type: data.channel_type === 'group' ? 'group' : 'announcement'
  }),
  transformRequest: (data) => {
    const transformed: Record<string, any> = {};
    
    // Pass through relevant fields
    if (data.name !== undefined) transformed.name = data.name;
    if (data.description !== undefined) transformed.description = data.description;
    if (data.is_public !== undefined) transformed.is_public = data.is_public;
    if (data.channel_type !== undefined) transformed.channel_type = data.channel_type;
    if (data.created_by !== undefined) transformed.created_by = data.created_by;
    
    return transformed;
  },
  useQueryOperations: true,
  useMutationOperations: true,
  useBatchOperations: false
});

// Extract individual operations for direct usage
export const {
  getAll: getAllChatChannels,
  getById: getChatChannelById,
  create: createChatChannel,
  update: updateChatChannel,
  delete: deleteChatChannel
} = chatChannelsApi;

/**
 * Get chat channel with tags and creator details
 */
export const getChatChannelWithDetails = async (channelId: string): Promise<ApiResponse<ChatChannelWithDetails>> => {
  return apiClient.query(async () => {
    try {
      // Use repository pattern to get the channel
      const repository = createRepository('chat_channels');
      
      const { data, error } = await repository
        .select(`
          *,
          created_by_profile:profiles!chat_channels_created_by_fkey(
            id, first_name, last_name, avatar_url, email, headline, bio, linkedin_url, 
            twitter_url, website_url, company, created_at, updated_at, is_approved, membership_tier, location_id
          )
        `)
        .eq('id', channelId)
        .single();
        
      if (error) {
        return createErrorResponse(error);
      }
      
      // Type assertion to ensure we can access properties safely
      const channel = data as ChatChannelRow & {
        created_by_profile?: Profile | null;
      };
      
      // Get tags assigned to this channel
      const tagAssignmentsRepo = createRepository('tag_assignments');
      const { data: tagAssignments, error: tagError } = await tagAssignmentsRepo
        .select(`
          *,
          tag:tags(*)
        `)
        .eq('target_id', channelId)
        .eq('target_type', EntityType.CHAT)
        .execute();
        
      if (tagError) {
        logger.error("Error fetching tag assignments:", tagError);
        // Continue despite error, just log it
      }
      
      // Create a properly transformed channel using our standard structure
      const baseChannel: ChatChannel = {
        id: channel.id,
        name: channel.name || null,
        description: channel.description || null,
        is_public: channel.is_public !== false,
        created_at: channel.created_at || '',
        updated_at: channel.updated_at || channel.created_at || '',
        created_by: channel.created_by || null,
        channel_type: channel.channel_type === 'group' ? 'group' : 'announcement'
      };
      
      // Properly cast tagAssignments to the correct type
      const typedTagAssignments = Array.isArray(tagAssignments) 
        ? tagAssignments as TagAssignment[] 
        : [];
      
      const result: ChatChannelWithDetails = {
        ...baseChannel,
        created_by_profile: channel.created_by_profile || null,
        tag_assignments: typedTagAssignments
      };
      
      return createSuccessResponse(result);
    } catch (error) {
      logger.error("Exception in getChatChannelWithDetails:", error);
      return createErrorResponse(error);
    }
  });
};

/**
 * Update channel tags (remove all existing and add new ones)
 */
export const updateChannelTags = async (
  channelId: string, 
  tagIds: string[]
): Promise<ApiResponse<boolean>> => {
  return apiClient.query(async () => {
    try {
      const tagAssignmentsRepo = createRepository('tag_assignments');
      
      // Delete existing tag assignments
      const { error: deleteError } = await tagAssignmentsRepo
        .delete()
        .eq('target_id', channelId)
        .eq('target_type', EntityType.CHAT)
        .execute();
        
      if (deleteError) {
        logger.error("Error deleting existing tag assignments:", deleteError);
        return createErrorResponse(deleteError);
      }
      
      // If there are new tags to assign, create those assignments
      if (tagIds.length > 0) {
        const tagAssignments = tagIds.map(tagId => ({
          tag_id: tagId,
          target_id: channelId,
          target_type: EntityType.CHAT
        }));
        
        const { error: insertError } = await tagAssignmentsRepo
          .insert(tagAssignments)
          .execute();
          
        if (insertError) {
          logger.error("Error creating new tag assignments:", insertError);
          return createErrorResponse(insertError);
        }
      }
      
      return createSuccessResponse(true);
    } catch (error) {
      logger.error("Exception in updateChannelTags:", error);
      return createErrorResponse(error);
    }
  });
};
