import { apiClient } from '../core/apiClient';
import { createApiFactory } from '../core/factory';
import { createRepository } from '../core/repository/repositoryFactory';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { ChatMessage, ChatMessageWithAuthor } from '@/types/chat';
import { ApiResponse, createErrorResponse, createSuccessResponse } from '../core/errorHandler';
import { processChatMessage, formatAuthorName } from '@/utils/chat/messageUtils';

/**
 * API Factory for chat messages
 */
export const chatMessageApi = createApiFactory<ChatMessageWithAuthor, string>({
  tableName: 'chats',
  idField: 'id',
  useQueryOperations: true,
  useMutationOperations: true,
  
  // Configure repository with enhanced features
  repository: {
    type: 'supabase',
    enhanced: true,
    enableLogging: true
  },
  
  // Transform raw database response to domain type using shared utility
  transformResponse: (data) => {
    // Return empty data if missing
    if (!data) return {} as ChatMessageWithAuthor;
    
    // Use the shared message processing utility for consistent handling
    return processChatMessage(data);
  }
});

/**
 * Get channel messages with author details and reply counts
 */
export const getChannelMessages = async (
  channelId: string | null | undefined,
  limit = 50,
  offset = 0
): Promise<ApiResponse<ChatMessageWithAuthor[]>> => {
  return apiClient.query(async () => {
    try {
      logger.info(`[CODE PATH] API FETCH: getChannelMessages called for channel ${channelId}`);
      logger.info(`[API FETCH] User timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
      
      // Check authentication
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        logger.error('[API FETCH] No authenticated session when fetching messages');
        return createErrorResponse(new Error("Authentication required"));
      }
      
      // Validate channelId - Return empty array for missing/invalid channelId instead of error
      if (!channelId || channelId === 'null' || channelId === 'undefined') {
        logger.warn('[API FETCH] Invalid or missing channelId provided to getChannelMessages:', channelId);
        return createSuccessResponse([]);
      }
      
      logger.info(`[API FETCH] Fetching messages for channel ID: "${channelId}" with user ${sessionData.session.user.id}`);
      
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
        .is('parent_id', null) // Use is() instead of eq() for NULL values
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);
        
      logger.info('[API FETCH] Executing database query');
      const result = await query.execute();
      
      if (result.error) {
        logger.error('[API FETCH] Error fetching channel messages:', result.error);
        return createErrorResponse(result.error);
      }
      
      const messagesResult = result.data || [];
      logger.info(`[API FETCH] Retrieved ${messagesResult.length} messages from database`);
      
      // If there are no messages, return empty array
      if (messagesResult.length === 0) {
        return createSuccessResponse([]);
      }
      
      // Extract message IDs for efficient reply count query
      const messageIds = messagesResult.map((msg: any) => msg.id);
      
      // OPTIMIZATION: Single query to get reply counts for all messages at once
      // This replaces the previous approach that made a separate query for each message
      logger.info('[API FETCH] Fetching reply counts for messages');
      const replyCounts = await getReplyCountsForMessages(messageIds);
      
      // Log timestamps for debugging timezone issues
      messagesResult.forEach((msg: any) => {
        logger.info(`[API FETCH] Message ID ${msg.id} raw timestamp from DB: ${msg.created_at}`);
      });
      
      // Apply reply counts to messages and process them consistently using our utility
      logger.info('[API FETCH] Processing messages with processChatMessage utility');
      const transformedMessages = messagesResult.map((msg: any): ChatMessageWithAuthor => {
        // Add reply count to the message object before processing
        const replyCount = replyCounts[msg.id] || 0;
        msg.reply_count = replyCount;
        
        // Use shared processing utility for consistent handling
        const processedMsg = processChatMessage(msg);
        logger.info(`[API FETCH] Processed message ${processedMsg.id}: raw=${processedMsg.created_at}, formatted=${processedMsg.formatted_time}`);
        return processedMsg;
      });
      
      logger.info(`[API FETCH] Returning ${transformedMessages.length} processed messages`);
      return createSuccessResponse(transformedMessages);
    } catch (error) {
      logger.error('[API FETCH] Exception in getChannelMessages:', error);
      return createErrorResponse(error);
    }
  });
};

/**
 * Get reply counts for multiple messages in a single query
 * This is a major optimization over querying counts individually
 */
async function getReplyCountsForMessages(messageIds: string[]): Promise<Record<string, number>> {
  try {
    if (!messageIds.length) return {};
    
    // Execute a single query to count replies for all messages
    // Using Supabase's implicit grouping approach where any non-aggregated column is used as grouping column
    const { data, error } = await supabase
      .from('chat_reply_counts')
      .select('*')
      .in('parent_id', messageIds);
      
    if (error) {
      logger.error('Error fetching reply counts:', error);
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
    logger.error('Error in getReplyCountsForMessages:', error);
    return {};
  }
}

/**
 * Get thread replies with author details
 */
export const getThreadReplies = async (
  parentId: string | null | undefined,
  limit = 50,
  offset = 0
): Promise<ApiResponse<ChatMessageWithAuthor[]>> => {
  return apiClient.query(async () => {
    try {
      // Validate parentId
      if (!parentId || parentId === 'null' || parentId === 'undefined') {
        logger.error('Invalid parentId provided to getThreadReplies:', parentId);
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
        logger.error('Error fetching thread replies:', result.error);
        return createErrorResponse(result.error);
      }
      
      // Log timestamps for debugging
      if (result.data && result.data.length > 0) {
        result.data.forEach((msg: any) => {
          logger.info(`Thread reply ID ${msg.id} raw timestamp: ${msg.created_at}`);
        });
      }
      
      // Transform the raw messages using our shared utility
      const transformedMessages = (result.data || []).map((msg: any): ChatMessageWithAuthor => {
        return processChatMessage(msg);
      });
      
      return createSuccessResponse(transformedMessages);
    } catch (error) {
      logger.error('Exception in getThreadReplies:', error);
      return createErrorResponse(error);
    }
  });
};

/**
 * Send a chat message
 */
export const sendChatMessage = async (
  channelId: string | null | undefined,
  message: string,
  userId: string | null | undefined,
  parentId?: string | null | undefined
): Promise<ApiResponse<ChatMessage>> => {
  return apiClient.query(async () => {
    try {
      // Check if user is authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        logger.error('No authenticated session when sending message');
        return createErrorResponse(new Error("Authentication required"));
      }

      // Validate inputs
      if (!channelId || channelId === 'null' || channelId === 'undefined') {
        logger.error('Invalid channelId provided to sendChatMessage:', channelId);
        return createErrorResponse(new Error("Invalid channel ID"));
      }
      
      if (!userId || userId === 'null' || userId === 'undefined') {
        logger.error('Invalid userId provided to sendChatMessage:', userId);
        return createErrorResponse(new Error("Invalid user ID"));
      }
      
      // Verify the user is sending as themselves
      if (userId !== sessionData.session.user.id) {
        logger.error(`User ID mismatch: ${userId} vs ${sessionData.session.user.id}`);
        return createErrorResponse(new Error("Cannot send messages as another user"));
      }
      
      // Check if parentId is valid
      if (parentId === 'null' || parentId === 'undefined') {
        parentId = null;
      }
      
      logger.info(`Sending chat message: channel=${channelId}, user=${userId}, parentId=${parentId || 'none'}, message=${message}`);
      
      const repository = createRepository('chats');
      
      const newMessage = {
        channel_id: channelId,
        message: message,
        user_id: userId,
        parent_id: parentId || null
      };
      
      logger.info('New message object to insert:', newMessage);
      
      const result = await repository
        .insert(newMessage)
        .select()
        .execute();
        
      // Handle result
      if (!result.data || result.error) {
        logger.error('Error sending message:', result.error);
        return createErrorResponse(result.error);
      }
      
      logger.info('Message inserted successfully, result:', result);
      
      const data = Array.isArray(result.data) ? result.data[0] : result.data;
      
      if (!data) {
        return createErrorResponse(new Error("Failed to create message: No data returned"));
      }
      
      // Type cast data to ensure we can access its properties safely
      const typedData = data as Record<string, any>;
      
      // Log the timestamp for debugging
      logger.info(`New message timestamp: ${typedData.created_at}`);
      
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
      logger.error('Exception in sendChatMessage:', error);
      return createErrorResponse(error);
    }
  });
};
