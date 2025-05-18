
import { createApiFactory } from '../core/factory/apiFactory';
import { ChatChannel, ChatChannelCreate, ChatChannelUpdate, ChatChannelWithDetails } from '@/types/chat';
import { apiClient } from '../core/apiClient';
import { Tag, TagAssignment } from '@/utils/tags/types';
import { EntityType } from '@/types/entityTypes';
import { createSuccessResponse, ApiResponse, createErrorResponse } from '../core/errorHandler';
import { logger } from '@/utils/logger';

/**
 * Create API operations for chat channels using the factory pattern
 */
export const chatChannelsApi = createApiFactory<ChatChannel, string, ChatChannelCreate, ChatChannelUpdate>({
  tableName: 'chat_channels',
  entityName: 'chatChannel',
  defaultOrderBy: 'created_at',
  transformResponse: (data) => ({
    id: data.id,
    name: data.name,
    is_public: data.is_public !== false, // Default to true if null
    created_at: data.created_at,
    updated_at: data.updated_at || data.created_at,
    created_by: data.created_by,
    channel_type: data.channel_type || 'group'
  }),
  transformRequest: (data) => {
    const transformed: Record<string, any> = {};
    if (data.name !== undefined) transformed.name = data.name;
    if (data.is_public !== undefined) transformed.is_public = data.is_public;
    if (data.channel_type !== undefined) transformed.channel_type = data.channel_type;
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
 * Create a chat channel with tags
 * @param data Channel data with optional tag IDs
 * @returns New chat channel data
 */
export const createChannelWithTags = async (
  data: ChatChannelCreate
): Promise<ApiResponse<ChatChannel>> => {
  return apiClient.query(async (client) => {
    try {
      // Start a transaction
      const { data: userData } = await client.auth.getUser();
      if (!userData?.user) {
        return createErrorResponse({
          message: 'User must be authenticated to create a chat channel',
          code: 'auth_required'
        });
      }
      
      // Extract tag IDs and prepare channel data
      const tagIds = data.tag_ids || [];
      const channelData = { 
        name: data.name,
        is_public: data.is_public,
        channel_type: data.channel_type,
        created_by: userData.user.id
      };
      
      // Create channel
      const { data: channel, error } = await client
        .from('chat_channels')
        .insert([channelData])
        .select()
        .single();
        
      if (error) {
        logger.error("Error creating chat channel:", error);
        return createErrorResponse(error);
      }
      
      // If there are tags to assign, create tag assignments
      if (tagIds.length > 0 && channel) {
        const tagAssignments = tagIds.map(tagId => ({
          tag_id: tagId,
          target_id: channel.id,
          target_type: EntityType.CHAT
        }));
        
        const { error: tagError } = await client
          .from('tag_assignments')
          .insert(tagAssignments);
          
        if (tagError) {
          logger.error("Error assigning tags to channel:", tagError);
          // We don't fail the whole operation if tag assignment fails
        }
      }
      
      return createSuccessResponse(chatChannelsApi.operations.transformResponse(channel));
    } catch (error) {
      logger.error("Exception in createChannelWithTags:", error);
      return createErrorResponse(error);
    }
  });
};

/**
 * Get chat channel with tags and creator details
 */
export const getChatChannelWithDetails = async (channelId: string): Promise<ApiResponse<ChatChannelWithDetails>> => {
  return apiClient.query(async (client) => {
    try {
      // Get the channel
      const { data: channel, error } = await client
        .from('chat_channels')
        .select(`
          *,
          created_by_profile:profiles!chat_channels_created_by_fkey(
            id, first_name, last_name, avatar_url
          )
        `)
        .eq('id', channelId)
        .single();
        
      if (error) {
        return createErrorResponse(error);
      }
      
      // Get tags assigned to this channel
      const { data: tagAssignments, error: tagError } = await client
        .from('tag_assignments')
        .select(`
          *,
          tag:tags(*)
        `)
        .eq('target_id', channelId)
        .eq('target_type', EntityType.CHAT);
        
      if (tagError) {
        logger.error("Error fetching tag assignments:", tagError);
        // Continue despite error, just log it
      }
      
      const result = {
        ...chatChannelsApi.operations.transformResponse(channel),
        created_by_profile: channel.created_by_profile,
        tag_assignments: tagAssignments || []
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
  return apiClient.query(async (client) => {
    try {
      // Delete existing tag assignments
      const { error: deleteError } = await client
        .from('tag_assignments')
        .delete()
        .eq('target_id', channelId)
        .eq('target_type', EntityType.CHAT);
        
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
        
        const { error: insertError } = await client
          .from('tag_assignments')
          .insert(tagAssignments);
          
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
