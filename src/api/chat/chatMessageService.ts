import { apiClient } from '../core/apiClient';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { ChatMessage, ChatMessageWithAuthor } from '@/types/chat';
import { ApiResponse, createErrorResponse, createSuccessResponse } from '../core/errorHandler';
import { ChatMessageFactory } from '@/utils/chat/ChatMessageFactory';
import { createRepository } from '../core/repository/repositoryFactory';

/**
 * Chat Message Service
 * 
 * Centralizes business logic for chat messages
 */
export class ChatMessageService {
  /**
   * Get channel messages with author details and reply counts
   */
  static async getChannelMessages(
    channelId: string | null | undefined,
    limit = 50,
    offset = 0
  ): Promise<ApiResponse<ChatMessageWithAuthor[]>> {
    return apiClient.query(async () => {
      try {
        logger.info(`[API] getChannelMessages called for channel ${channelId}`);
        
        // Check authentication
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          logger.error('[API] No authenticated session when fetching messages');
          return createErrorResponse(new Error("Authentication required"));
        }
        
        // Validate channelId - Return empty array for missing/invalid channelId
        if (!channelId || channelId === 'null' || channelId === 'undefined') {
          logger.warn('[API] Invalid or missing channelId provided:', channelId);
          return createSuccessResponse([]);
        }
        
        // Create repository for base message query
        const repository = createRepository('chats');
        
        // Query messages with author details
        const query = repository
          .select(`
            *,
            author:profiles(
              id, first_name, last_name, avatar_url
            )
          `)
          .eq('channel_id', channelId)
          .is('parent_id', null)
          .order('created_at', { ascending: true })
          .range(offset, offset + limit - 1);
          
        const result = await query.execute();
        
        if (result.error) {
          logger.error('[API] Error fetching channel messages:', result.error);
          return createErrorResponse(result.error);
        }
        
        const messagesResult = result.data || [];
        
        // If there are no messages, return empty array
        if (messagesResult.length === 0) {
          return createSuccessResponse([]);
        }
        
        // Extract message IDs for efficient reply count query
        const messageIds = messagesResult.map((msg: any) => msg.id);
        
        // Get reply counts
        const replyCounts = await this.getReplyCountsForMessages(messageIds);
        
        // Process messages with our factory
        const transformedMessages = messagesResult.map((msg: any): ChatMessageWithAuthor => {
          // Add reply count to the message object before processing
          msg.reply_count = replyCounts[msg.id] || 0;
          
          // Use the factory to create a standardized message
          return ChatMessageFactory.createMessageWithAuthor(msg);
        });
        
        return createSuccessResponse(transformedMessages);
      } catch (error) {
        logger.error('[API] Exception in getChannelMessages:', error);
        return createErrorResponse(error);
      }
    });
  }
  
  /**
   * Get thread replies with author details
   */
  static async getThreadReplies(
    parentId: string | null | undefined,
    limit = 50,
    offset = 0
  ): Promise<ApiResponse<ChatMessageWithAuthor[]>> {
    return apiClient.query(async () => {
      try {
        // Validate parentId
        if (!parentId || parentId === 'null' || parentId === 'undefined') {
          logger.error('[API] Invalid parentId provided:', parentId);
          return createErrorResponse(new Error("Invalid parent message ID"));
        }
        
        // Create repository for chat messages
        const repository = createRepository('chats');
        
        // Query replies with author details
        const query = repository
          .select(`
            *,
            author:profiles(
              id, first_name, last_name, avatar_url
            )
          `)
          .eq('parent_id', parentId)
          .order('created_at', { ascending: true })
          .range(offset, offset + limit - 1);
          
        const result = await query.execute();
          
        if (result.error) {
          logger.error('[API] Error fetching thread replies:', result.error);
          return createErrorResponse(result.error);
        }
        
        // Process messages with our factory
        const transformedMessages = (result.data || []).map(
          (msg: any): ChatMessageWithAuthor => ChatMessageFactory.createMessageWithAuthor(msg)
        );
        
        return createSuccessResponse(transformedMessages);
      } catch (error) {
        logger.error('[API] Exception in getThreadReplies:', error);
        return createErrorResponse(error);
      }
    });
  }
  
  /**
   * Send a chat message
   */
  static async sendChatMessage(
    channelId: string | null | undefined,
    message: string,
    userId: string | null | undefined,
    parentId?: string | null | undefined
  ): Promise<ApiResponse<ChatMessage>> {
    return apiClient.query(async () => {
      try {
        // Check if user is authenticated
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          logger.error('[API] No authenticated session when sending message');
          return createErrorResponse(new Error("Authentication required"));
        }

        // Validate inputs
        if (!channelId || channelId === 'null' || channelId === 'undefined') {
          logger.error('[API] Invalid channelId provided:', channelId);
          return createErrorResponse(new Error("Invalid channel ID"));
        }
        
        if (!userId || userId === 'null' || userId === 'undefined') {
          logger.error('[API] Invalid userId provided:', userId);
          return createErrorResponse(new Error("Invalid user ID"));
        }
        
        // Verify the user is sending as themselves
        if (userId !== sessionData.session.user.id) {
          logger.error(`[API] User ID mismatch: ${userId} vs ${sessionData.session.user.id}`);
          return createErrorResponse(new Error("Cannot send messages as another user"));
        }
        
        // Check if parentId is valid
        if (parentId === 'null' || parentId === 'undefined') {
          parentId = null;
        }
        
        const repository = createRepository('chats');
        
        const newMessage = {
          channel_id: channelId,
          message: message,
          user_id: userId,
          parent_id: parentId || null
        };
        
        const result = await repository
          .insert(newMessage)
          .select()
          .execute();
          
        // Handle result
        if (!result.data || result.error) {
          logger.error('[API] Error sending message:', result.error);
          return createErrorResponse(result.error);
        }
        
        const data = Array.isArray(result.data) ? result.data[0] : result.data;
        
        if (!data) {
          return createErrorResponse(new Error("Failed to create message: No data returned"));
        }
        
        // Type cast data to ensure we can access its properties safely
        const typedData = data as Record<string, any>;
        
        const chatMessage: ChatMessage = {
          id: typedData.id,
          channel_id: typedData.channel_id,
          parent_id: typedData.parent_id,
          user_id: typedData.user_id,
          message: typedData.message,
          created_at: typedData.created_at,
          updated_at: typedData.updated_at || typedData.created_at
        };
        
        return createSuccessResponse(chatMessage);
      } catch (error) {
        logger.error('[API] Exception in sendChatMessage:', error);
        return createErrorResponse(error);
      }
    });
  }
  
  /**
   * Get reply counts for multiple messages in a single query
   * This is a major optimization over querying counts individually
   */
  private static async getReplyCountsForMessages(messageIds: string[]): Promise<Record<string, number>> {
    try {
      if (!messageIds.length) return {};
      
      // Execute a single query to count replies for all messages
      const { data, error } = await supabase
        .from('chat_reply_counts')
        .select('*')
        .in('parent_id', messageIds);
        
      if (error) {
        logger.error('[API] Error fetching reply counts:', error);
        return {};
      }
      
      // Convert the result to a map of message ID -> count
      const countMap: Record<string, number> = {};
      if (data) {
        data.forEach((item: any) => {
          if (item.parent_id && item.count) {
            countMap[item.parent_id] = parseInt(item.count, 10);
          }
        });
      }
      
      return countMap;
    } catch (error) {
      logger.error('[API] Error in getReplyCountsForMessages:', error);
      return {};
    }
  }
  
  /**
   * Get recent channel messages for preview (limited number)
   */
  static async getChannelMessagePreviews(
    channelId: string | null | undefined,
    limit = 3
  ): Promise<ApiResponse<ChatMessageWithAuthor[]>> {
    return apiClient.query(async () => {
      try {
        // Validate channelId
        if (!channelId || channelId === 'null' || channelId === 'undefined') {
          logger.warn('[API] Invalid or missing channelId provided:', channelId);
          return createSuccessResponse([]);
        }
        
        // Create repository for base message query
        const repository = createRepository('chats');
        
        // Query messages with author details, limited count
        const query = repository
          .select(`
            *,
            author:profiles(
              id, first_name, last_name, avatar_url
            )
          `)
          .eq('channel_id', channelId)
          .is('parent_id', null)
          .order('created_at', { ascending: false }) // Most recent first
          .limit(limit);
          
        const result = await query.execute();
        
        if (result.error) {
          logger.error('[API] Error fetching channel message previews:', result.error);
          return createErrorResponse(result.error);
        }
        
        const messagesResult = result.data || [];
        
        // If there are no messages, return empty array
        if (messagesResult.length === 0) {
          return createSuccessResponse([]);
        }
        
        // Process messages with our factory
        const transformedMessages = messagesResult.map((msg: any): ChatMessageWithAuthor => {
          return ChatMessageFactory.createMessageWithAuthor(msg);
        });
        
        // Return messages in chronological order (oldest first)
        return createSuccessResponse(transformedMessages.reverse());
      } catch (error) {
        logger.error('[API] Exception in getChannelMessagePreviews:', error);
        return createErrorResponse(error);
      }
    });
  }
}

// Export individual functions for backward compatibility and easier testing

/**
 * Get channel messages with author details and reply counts
 */
export const getChannelMessages = (
  channelId: string | null | undefined,
  limit = 50,
  offset = 0
) => ChatMessageService.getChannelMessages(channelId, limit, offset);

/**
 * Get thread replies with author details
 */
export const getThreadReplies = (
  parentId: string | null | undefined,
  limit = 50,
  offset = 0
) => ChatMessageService.getThreadReplies(parentId, limit, offset);

/**
 * Send a chat message
 */
export const sendChatMessage = (
  channelId: string | null | undefined,
  message: string,
  userId: string | null | undefined,
  parentId?: string | null | undefined
) => ChatMessageService.sendChatMessage(channelId, message, userId, parentId);

/**
 * Get channel message previews (limited number for display in UI)
 */
export const getChannelMessagePreviews = (
  channelId: string | null | undefined,
  limit = 3
) => ChatMessageService.getChannelMessagePreviews(channelId, limit);
