
import { apiClient } from '../core/apiClient';
import { ApiResponse, createSuccessResponse, createErrorResponse } from '../core/errorHandler';
import { ChatMessageWithAuthor } from '@/types/chat';
import { ChatMessageFactory } from '@/utils/chat/ChatMessageFactory';
import { logger } from '@/utils/logger';

/**
 * Get channel messages with optional client parameter
 */
export const getChannelMessages = async (
  channelId: string,
  limit = 50,
  offset = 0,
  client?: any
): Promise<ApiResponse<ChatMessageWithAuthor[]>> => {
  return apiClient.query(async (defaultClient) => {
    try {
      const activeClient = client || defaultClient;
      
      // Build the query for channel messages
      let query = activeClient
        .from('chats')
        .select(`
          *,
          user:profiles!chats_user_id_fkey(
            id, first_name, last_name, avatar_url, email, headline, bio, linkedin_url, 
            twitter_url, website_url, company, created_at, updated_at, is_approved, membership_tier, location_id
          )
        `)
        .eq('channel_id', channelId)
        .is('parent_id', null) // Only top-level messages (not replies)
        .order('created_at', { ascending: false });

      // Apply pagination
      if (limit > 0) {
        query = query.limit(limit);
      }
      if (offset > 0) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching channel messages:', error);
        return createErrorResponse(error);
      }

      // Transform the data using the ChatMessageFactory
      const transformedMessages = (data || []).map((message: any) => 
        ChatMessageFactory.createMessageWithAuthor(message)
      );

      return createSuccessResponse(transformedMessages);
    } catch (error) {
      logger.error('Exception in getChannelMessages:', error);
      return createErrorResponse(error);
    }
  });
};

/**
 * Get thread replies with optional client parameter
 */
export const getThreadReplies = async (
  messageId: string,
  limit = 50,
  offset = 0,
  client?: any
): Promise<ApiResponse<ChatMessageWithAuthor[]>> => {
  return apiClient.query(async (defaultClient) => {
    try {
      const activeClient = client || defaultClient;
      
      // Build the query for thread replies
      let query = activeClient
        .from('chats')
        .select(`
          *,
          user:profiles!chats_user_id_fkey(
            id, first_name, last_name, avatar_url, email, headline, bio, linkedin_url, 
            twitter_url, website_url, company, created_at, updated_at, is_approved, membership_tier, location_id
          )
        `)
        .eq('parent_id', messageId)
        .order('created_at', { ascending: true });

      // Apply pagination
      if (limit > 0) {
        query = query.limit(limit);
      }
      if (offset > 0) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching thread replies:', error);
        return createErrorResponse(error);
      }

      // Transform the data using the ChatMessageFactory
      const transformedMessages = (data || []).map((message: any) => 
        ChatMessageFactory.createMessageWithAuthor(message)
      );

      return createSuccessResponse(transformedMessages);
    } catch (error) {
      logger.error('Exception in getThreadReplies:', error);
      return createErrorResponse(error);
    }
  });
};

/**
 * Send a chat message with optional client parameter
 */
export const sendChatMessage = async (
  channelId: string,
  message: string,
  userId: string,
  parentId?: string | null,
  client?: any
): Promise<ApiResponse<ChatMessageWithAuthor>> => {
  return apiClient.query(async (defaultClient) => {
    try {
      const activeClient = client || defaultClient;
      
      // Prepare the message data
      const messageData = {
        channel_id: channelId,
        user_id: userId,
        message: message.trim(),
        parent_id: parentId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert the message
      const { data, error } = await activeClient
        .from('chats')
        .insert(messageData)
        .select(`
          *,
          user:profiles!chats_user_id_fkey(
            id, first_name, last_name, avatar_url, email, headline, bio, linkedin_url, 
            twitter_url, website_url, company, created_at, updated_at, is_approved, membership_tier, location_id
          )
        `)
        .single();

      if (error) {
        logger.error('Error sending chat message:', error);
        return createErrorResponse(error);
      }

      // Transform the response using the ChatMessageFactory
      const transformedMessage = ChatMessageFactory.createMessageWithAuthor(data);

      return createSuccessResponse(transformedMessage);
    } catch (error) {
      logger.error('Exception in sendChatMessage:', error);
      return createErrorResponse(error);
    }
  });
};

/**
 * Get channel message previews with optional client parameter
 */
export const getChannelMessagePreviews = async (
  channelId: string,
  client?: any
): Promise<ApiResponse<ChatMessageWithAuthor[]>> => {
  return apiClient.query(async (defaultClient) => {
    try {
      const activeClient = client || defaultClient;
      
      // Get the latest 3 messages from the channel for preview
      const { data, error } = await activeClient
        .from('chats')
        .select(`
          *,
          user:profiles!chats_user_id_fkey(
            id, first_name, last_name, avatar_url, email, headline, bio, linkedin_url, 
            twitter_url, website_url, company, created_at, updated_at, is_approved, membership_tier, location_id
          )
        `)
        .eq('channel_id', channelId)
        .is('parent_id', null) // Only top-level messages
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        logger.error('Error fetching channel message previews:', error);
        return createErrorResponse(error);
      }

      // Transform the data using the ChatMessageFactory
      const transformedMessages = (data || []).map((message: any) => 
        ChatMessageFactory.createMessageWithAuthor(message)
      );

      return createSuccessResponse(transformedMessages);
    } catch (error) {
      logger.error('Exception in getChannelMessagePreviews:', error);
      return createErrorResponse(error);
    }
  });
};
