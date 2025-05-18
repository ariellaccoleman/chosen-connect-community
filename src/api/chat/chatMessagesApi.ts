
import { apiClient } from '../core/apiClient';
import { createSuccessResponse, createErrorResponse, ApiResponse } from '../core/errorHandler';
import { ChatMessage, ChatMessageCreate, ChatMessageWithAuthor } from '@/types/chat';
import { createRepository } from '../core/repository/repositoryFactory';
import { logger } from '@/utils/logger';

/**
 * Get messages for a specific channel
 */
export const getChannelMessages = async (
  channelId: string,
  limit = 50,
  offset = 0
): Promise<ApiResponse<ChatMessageWithAuthor[]>> => {
  return apiClient.query(async () => {
    try {
      // Create repository for chat messages
      const repository = createRepository('chats');
      
      // Query messages with author details
      const { data, error } = await repository
        .select(`
          *,
          author:profiles(
            id, first_name, last_name, avatar_url
          )
        `)
        .eq('channel_id', channelId)
        .is('parent_id', null) // Only get top-level messages
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);
        
      if (error) {
        logger.error('Error fetching channel messages:', error);
        return createErrorResponse(error);
      }

      // Count replies for each message
      const messagesToUpdate = data || [];
      
      // If there are messages, get reply counts for them
      if (messagesToUpdate.length > 0) {
        const messageIds = messagesToUpdate.map(msg => (msg as any).id);
        const countsRepo = createRepository('chats');
        
        const { data: replyCounts, error: countsError } = await countsRepo
          .select('parent_id, count(*)')
          .in('parent_id', messageIds)
          .group('parent_id');
          
        if (countsError) {
          logger.error('Error fetching reply counts:', countsError);
          // Continue despite error, just log it
        }
        
        // Map of message ID to reply count
        const replyCountMap: Record<string, number> = {};
        
        if (replyCounts) {
          replyCounts.forEach((item: any) => {
            replyCountMap[item.parent_id] = parseInt(item.count, 10);
          });
        }
        
        // Transform the raw messages into our expected format
        const transformedMessages = messagesToUpdate.map((msg: any): ChatMessageWithAuthor => {
          // Format the author name
          let fullName = 'Anonymous';
          if (msg.author) {
            const firstName = msg.author.first_name || '';
            const lastName = msg.author.last_name || '';
            fullName = [firstName, lastName].filter(Boolean).join(' ');
            
            if (msg.author) {
              msg.author.full_name = fullName || 'Anonymous';
            }
          }
          
          return {
            id: msg.id,
            channel_id: msg.channel_id,
            parent_id: msg.parent_id,
            user_id: msg.user_id,
            message: msg.message,
            created_at: msg.created_at,
            updated_at: msg.updated_at || msg.created_at,
            author: msg.author,
            reply_count: replyCountMap[msg.id] || 0
          };
        });
        
        return createSuccessResponse(transformedMessages);
      }
      
      return createSuccessResponse([]);
    } catch (error) {
      logger.error('Exception in getChannelMessages:', error);
      return createErrorResponse(error);
    }
  });
};

/**
 * Get replies for a specific message (thread)
 */
export const getThreadReplies = async (
  parentId: string,
  limit = 50,
  offset = 0
): Promise<ApiResponse<ChatMessageWithAuthor[]>> => {
  return apiClient.query(async () => {
    try {
      // Create repository for chat messages
      const repository = createRepository('chats');
      
      // Query replies with author details
      const { data, error } = await repository
        .select(`
          *,
          author:profiles(
            id, first_name, last_name, avatar_url
          )
        `)
        .eq('parent_id', parentId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);
        
      if (error) {
        logger.error('Error fetching thread replies:', error);
        return createErrorResponse(error);
      }
      
      // Transform the raw messages
      const transformedMessages = (data || []).map((msg: any): ChatMessageWithAuthor => {
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
 * Send a chat message to a channel or as a reply to a thread
 */
export const sendChatMessage = async (
  channelId: string,
  message: string,
  userId: string,
  parentId?: string | null
): Promise<ApiResponse<ChatMessage>> => {
  return apiClient.query(async () => {
    try {
      const repository = createRepository('chats');
      
      const newMessage = {
        channel_id: channelId,
        message: message,
        user_id: userId,
        parent_id: parentId || null
      };
      
      const { data, error } = await repository
        .insert(newMessage)
        .select()
        .single();
        
      if (error) {
        logger.error('Error sending message:', error);
        return createErrorResponse(error);
      }
      
      const result: ChatMessage = {
        id: (data as any).id,
        channel_id: (data as any).channel_id,
        parent_id: (data as any).parent_id,
        user_id: (data as any).user_id,
        message: (data as any).message,
        created_at: (data as any).created_at,
        updated_at: (data as any).updated_at || (data as any).created_at
      };
      
      return createSuccessResponse(result);
    } catch (error) {
      logger.error('Exception in sendChatMessage:', error);
      return createErrorResponse(error);
    }
  });
};
