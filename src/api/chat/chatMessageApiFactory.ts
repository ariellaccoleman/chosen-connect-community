
import { apiClient } from '../core/apiClient';
import { createApiFactory } from '../core/factory';
import { createRepository } from '../core/repository/repositoryFactory';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { ChatMessage, ChatMessageWithAuthor } from '@/types/chat';
import { ApiResponse, createErrorResponse, createSuccessResponse } from '../core/errorHandler';

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
  
  // Transform raw database response to domain type
  transformResponse: (data) => {
    // Return empty data if missing
    if (!data) return {} as ChatMessageWithAuthor;
    
    // Basic structure for transformed message
    const message: ChatMessageWithAuthor = {
      id: data.id,
      channel_id: data.channel_id,
      parent_id: data.parent_id,
      user_id: data.user_id,
      message: data.message,
      created_at: data.created_at,
      updated_at: data.updated_at || data.created_at,
      // Transform author data if present
      author: data.author ? {
        id: data.author.id,
        first_name: data.author.first_name,
        last_name: data.author.last_name,
        avatar_url: data.author.avatar_url,
        full_name: formatAuthorName(data.author)
      } : undefined,
      // Include reply count if present
      reply_count: data.reply_count || 0
    };
    
    return message;
  }
});

/**
 * Format author's full name
 */
function formatAuthorName(author: any): string {
  if (!author) return 'Anonymous';
  
  const firstName = author.first_name || '';
  const lastName = author.last_name || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  
  return fullName || 'Anonymous';
}

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
      // Check authentication
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        logger.error('No authenticated session when fetching messages');
        return createErrorResponse(new Error("Authentication required"));
      }
      
      // Validate channelId - Return empty array for missing/invalid channelId instead of error
      if (!channelId || channelId === 'null' || channelId === 'undefined') {
        logger.warn('Invalid or missing channelId provided to getChannelMessages:', channelId);
        return createSuccessResponse([]);
      }
      
      logger.info(`Fetching messages for channel ID: "${channelId}" with user ${sessionData.session.user.id}`);
      
      // Create repository with joins for author information
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
        .eq('parent_id', null) // Only get top-level messages
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);
        
      const result = await query.execute();
      
      if (result.error) {
        logger.error('Error fetching channel messages:', result.error);
        return createErrorResponse(result.error);
      }
      
      // Count replies for each message
      const messagesToUpdate = result.data || [];
      
      // If there are messages, get reply counts for them
      if (messagesToUpdate.length > 0) {
        const messageIds = messagesToUpdate.map(msg => (msg as any).id);
        const countsRepo = createRepository('chats');
        
        // Use select with aggregation
        const repliesQuery = countsRepo
          .select('parent_id, count(*)')
          .in('parent_id', messageIds);
          
        const repliesResult = await repliesQuery.execute();
        
        // Map of message ID to reply count
        const replyCountMap: Record<string, number> = {};
        
        if (repliesResult.data && !repliesResult.error) {
          repliesResult.data.forEach((item: any) => {
            replyCountMap[item.parent_id] = parseInt(item.count, 10);
          });
        } else if (repliesResult.error) {
          logger.error('Error fetching reply counts:', repliesResult.error);
          // Continue despite error, just log it
        }
        
        // Add reply counts to messages
        messagesToUpdate.forEach((msg: any) => {
          msg.reply_count = replyCountMap[msg.id] || 0;
        });
      }
      
      // Apply transformations to raw data
      const transformedMessages = messagesToUpdate.map((msg: any): ChatMessageWithAuthor => {
        // Format author information
        if (msg.author) {
          const firstName = msg.author.first_name || '';
          const lastName = msg.author.last_name || '';
          const fullName = [firstName, lastName].filter(Boolean).join(' ');
          msg.author.full_name = fullName || 'Anonymous';
        }
        
        // Return properly formatted message
        return {
          id: msg.id,
          channel_id: msg.channel_id,
          parent_id: msg.parent_id,
          user_id: msg.user_id,
          message: msg.message,
          created_at: msg.created_at,
          updated_at: msg.updated_at || msg.created_at,
          author: msg.author,
          reply_count: msg.reply_count || 0
        };
      });
      
      return createSuccessResponse(transformedMessages);
    } catch (error) {
      logger.error('Exception in getChannelMessages:', error);
      return createErrorResponse(error);
    }
  });
};

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
      
      // Transform the raw messages
      const transformedMessages = (result.data || []).map((msg: any): ChatMessageWithAuthor => {
        // Format the author name
        if (msg.author) {
          const firstName = msg.author.first_name || '';
          const lastName = msg.author.last_name || '';
          const fullName = [firstName, lastName].filter(Boolean).join(' ');
          msg.author.full_name = fullName || 'Anonymous';
        }
        
        return {
          id: msg.id,
          channel_id: msg.channel_id,
          parent_id: msg.parent_id,
          user_id: msg.user_id,
          message: msg.message,
          created_at: msg.created_at,
          updated_at: msg.updated_at || msg.created_at,
          author: msg.author
        };
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
