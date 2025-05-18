
import { apiClient } from '../core/apiClient';
import { createSuccessResponse, createErrorResponse, ApiResponse } from '../core/errorHandler';
import { ChatMessage, ChatMessageCreate, ChatMessageWithAuthor } from '@/types/chat';
import { createRepository } from '../core/repository/repositoryFactory';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

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
      // Check if user is authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        logger.error('No authenticated session when fetching messages');
        return createErrorResponse(new Error("Authentication required"));
      }

      if (!channelId || channelId === 'null' || channelId === 'undefined') {
        logger.error('Invalid channelId provided to getChannelMessages:', channelId);
        return createErrorResponse(new Error("Invalid channel ID"));
      }
      
      logger.info(`Fetching messages for channel ID: "${channelId}" with user ${sessionData.session.user.id}`);
      
      // Create repository for chat messages
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
      
      logger.info(`getChannelMessages result: ${result.data ? result.data.length : 0} messages found`);
      
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
          
        // Execute the query  
        const repliesResult = await repliesQuery.execute();
          
        if (repliesResult.error) {
          logger.error('Error fetching reply counts:', repliesResult.error);
          // Continue despite error, just log it
        }
        
        // Map of message ID to reply count
        const replyCountMap: Record<string, number> = {};
        
        if (repliesResult.data) {
          repliesResult.data.forEach((item: any) => {
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
      // Check if user is authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        logger.error('No authenticated session when sending message');
        return createErrorResponse(new Error("Authentication required"));
      }

      // Verify the user is sending as themselves
      if (userId !== sessionData.session.user.id) {
        logger.error(`User ID mismatch: ${userId} vs ${sessionData.session.user.id}`);
        return createErrorResponse(new Error("Cannot send messages as another user"));
      }

      if (!channelId || channelId === 'null' || channelId === 'undefined') {
        logger.error('Invalid channelId provided to sendChatMessage:', channelId);
        return createErrorResponse(new Error("Invalid channel ID"));
      }
      
      if (!userId || userId === 'null' || userId === 'undefined') {
        logger.error('Invalid userId provided to sendChatMessage:', userId);
        return createErrorResponse(new Error("Invalid user ID"));
      }
      
      logger.info(`Sending chat message: channel=${channelId}, user=${userId}, message=${message}`);
      
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
