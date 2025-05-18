
import { createApiFactory } from '../core/factory/apiFactory';
import { ChatMessage, ChatMessageCreate, ChatMessageUpdate, ChatMessageWithAuthor } from '@/types/chat';
import { apiClient } from '../core/apiClient';
import { createSuccessResponse, ApiResponse, createErrorResponse } from '../core/errorHandler';
import { logger } from '@/utils/logger';
import { createRepository } from '../core/repository/repositoryFactory';
import { Tables } from '@/integrations/supabase/types';

type ChatMessageRow = Tables<"chats">;

/**
 * Create API operations for chat messages using the factory pattern
 */
export const chatMessagesApi = createApiFactory<ChatMessage, string, ChatMessageCreate, ChatMessageUpdate>({
  tableName: 'chats',
  entityName: 'chatMessage',
  defaultOrderBy: 'created_at',
  transformResponse: (data: ChatMessageRow) => ({
    id: data.id,
    channel_id: data.channel_id || '',
    parent_id: data.parent_id,
    user_id: data.user_id,
    message: data.message,
    created_at: data.created_at || '',
    updated_at: data.updated_at || data.created_at || '',
  }),
  transformRequest: (data) => {
    const transformed: Record<string, any> = {};
    
    if (data.message !== undefined) transformed.message = data.message;
    if (data.channel_id !== undefined) transformed.channel_id = data.channel_id;
    if (data.parent_id !== undefined) transformed.parent_id = data.parent_id;
    if (data.user_id !== undefined) transformed.user_id = data.user_id;
    
    return transformed;
  },
  useQueryOperations: true,
  useMutationOperations: true,
  useBatchOperations: false
});

// Extract individual operations for direct usage
export const {
  getAll: getAllChatMessages,
  getById: getChatMessageById,
  create: createChatMessage,
  update: updateChatMessage,
  delete: deleteChatMessage
} = chatMessagesApi;

/**
 * Get messages for a specific channel with author details
 */
export const getChannelMessages = async (
  channelId: string, 
  limit = 50,
  offset = 0,
  parentId: string | null = null
): Promise<ApiResponse<ChatMessageWithAuthor[]>> => {
  return apiClient.query(async () => {
    try {
      const repository = createRepository('chats');
      
      // Build the query based on whether we're fetching main channel messages or threaded replies
      let query = repository
        .select(`
          *,
          author:profiles!chats_user_id_fkey(
            id, first_name, last_name, avatar_url
          )
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });
        
      // If parentId is null, get root messages (those without a parent)
      // If parentId is provided, get replies to that specific message
      if (parentId === null) {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', parentId);
      }
      
      // Apply pagination
      query = query.range(offset, offset + limit - 1);
      
      const { data, error } = await query.execute();
      
      if (error) {
        return createErrorResponse(error);
      }
      
      // Now fetch reply counts for each message if we're loading root messages
      let messageWithReplyCounts: ChatMessageWithAuthor[] = [];
      
      if (parentId === null && data && data.length > 0) {
        // Get all message IDs
        const messageIds = data.map(message => message.id);
        
        // Get reply counts in a separate query
        const replyCountsRepo = createRepository('chats');
        const { data: replyCounts, error: replyCountError } = await replyCountsRepo
          .select('parent_id, count(*)')
          .in('parent_id', messageIds)
          .not('parent_id', 'is', null)
          .group('parent_id')
          .execute();
          
        if (replyCountError) {
          logger.error("Error fetching reply counts:", replyCountError);
        }
        
        // Create a map of message ID to reply count
        const replyCountMap: Record<string, number> = {};
        if (replyCounts) {
          replyCounts.forEach(row => {
            replyCountMap[row.parent_id] = parseInt(row.count);
          });
        }
        
        // Add reply counts to messages
        messageWithReplyCounts = data.map(message => {
          // Safely cast the raw data to the structure we need
          const withAuthor = message as unknown as ChatMessageWithAuthor & {
            author?: { 
              id: string;
              first_name: string | null;
              last_name: string | null;
              avatar_url: string | null;
            } | null;
          };
          
          // Add full name for convenience
          if (withAuthor.author) {
            withAuthor.author.full_name = [
              withAuthor.author.first_name,
              withAuthor.author.last_name
            ].filter(Boolean).join(' ') || 'Anonymous';
          }
          
          return {
            ...withAuthor,
            reply_count: replyCountMap[message.id] || 0
          };
        });
      } else {
        // If we're loading thread replies, just transform the data
        messageWithReplyCounts = (data || []).map(message => {
          const withAuthor = message as unknown as ChatMessageWithAuthor & {
            author?: { 
              id: string;
              first_name: string | null;
              last_name: string | null;
              avatar_url: string | null;
            } | null;
          };
          
          // Add full name for convenience
          if (withAuthor.author) {
            withAuthor.author.full_name = [
              withAuthor.author.first_name,
              withAuthor.author.last_name
            ].filter(Boolean).join(' ') || 'Anonymous';
          }
          
          return withAuthor;
        });
      }
      
      return createSuccessResponse(messageWithReplyCounts);
    } catch (error) {
      logger.error("Exception in getChannelMessages:", error);
      return createErrorResponse(error);
    }
  });
};

/**
 * Send a new message to a channel
 */
export const sendChatMessage = async (
  channelId: string,
  message: string,
  userId: string,
  parentId: string | null = null
): Promise<ApiResponse<ChatMessage>> => {
  return apiClient.query(async () => {
    try {
      const repository = createRepository('chats');
      
      const messageData = {
        channel_id: channelId,
        message,
        user_id: userId,
        parent_id: parentId,
      };
      
      const { data, error } = await repository.insert(messageData).single();
      
      if (error) {
        return createErrorResponse(error);
      }
      
      return createSuccessResponse({
        id: data.id,
        channel_id: data.channel_id || '',
        parent_id: data.parent_id,
        user_id: data.user_id,
        message: data.message,
        created_at: data.created_at || '',
        updated_at: data.updated_at || data.created_at || '',
      });
    } catch (error) {
      logger.error("Exception in sendChatMessage:", error);
      return createErrorResponse(error);
    }
  });
};

/**
 * Get thread replies for a specific message
 */
export const getThreadReplies = async (
  messageId: string,
  limit = 50,
  offset = 0
): Promise<ApiResponse<ChatMessageWithAuthor[]>> => {
  return getChannelMessages('', limit, offset, messageId);
};
