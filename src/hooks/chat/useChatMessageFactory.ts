
import { createQueryHooks } from '@/hooks/core/factory';
import { chatMessageApi, getChannelMessages, getThreadReplies, sendChatMessage } from '@/api/chat/chatMessageApiFactory';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatMessageWithAuthor } from '@/types/chat';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import { ApiResponse, createSuccessResponse, createErrorResponse } from '@/api/core/errorHandler';

// Create standardized hooks using the factory pattern
export const chatMessageHooks = createQueryHooks(
  { name: 'chatMessage', pluralName: 'chatMessages' },
  chatMessageApi
);

/**
 * Hook for fetching channel messages with factory pattern support
 */
export const useChannelMessages = (
  channelId: string | null | undefined,
  limit = 50,
  offset = 0
) => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  // Validate channelId early
  const isValidChannelId = channelId && channelId !== 'null' && channelId !== 'undefined';

  return useQuery({
    queryKey: ['chatMessages', channelId, offset, limit],
    queryFn: async (): Promise<ApiResponse<ChatMessageWithAuthor[]>> => {
      logger.info(`[QUERY] Executing query for channel ${channelId}`);
      
      if (!isAuthenticated || !user) {
        logger.warn('[QUERY] User is not authenticated for fetching messages');
        return createErrorResponse({ 
          code: 'auth_required', 
          message: 'Authentication required', 
          details: null 
        });
      }

      // Don't attempt API call with invalid values
      if (!isValidChannelId) {
        logger.warn(`[QUERY] Invalid channelId provided: "${channelId}", returning empty array`);
        return createSuccessResponse([]);
      }
      
      // Call the API function to get channel messages
      return getChannelMessages(channelId, limit, offset);
    },
    // Only enable the query if we have both authentication and a valid channel ID
    enabled: isAuthenticated && !!user?.id && isValidChannelId,
    select: (response: ApiResponse<ChatMessageWithAuthor[]>) => {
      if (response.status === 'error') {
        logger.error('[QUERY] Error in channel messages response:', response.error);
        toast.error(response.error?.message || 'Failed to load messages');
        return [];
      }
      return response.data || [];
    },
    meta: {
      errorHandler: (error: Error) => {
        logger.error('[QUERY] Error in useChannelMessages:', error);
        queryClient.setQueryData(['chatMessages', channelId, offset, limit], []);
      }
    }
  });
};

/**
 * Hook for sending a new message to a channel
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  return useMutation({
    mutationFn: async ({ channelId, message, parentId }: { 
      channelId: string; 
      message: string;
      parentId?: string | null;
    }) => {
      if (!isAuthenticated || !user?.id) {
        logger.error('User not authenticated when trying to send message');
        toast.error('You need to be logged in to send messages');
        throw new Error('User is not authenticated');
      }
      
      if (!channelId || channelId === 'null' || channelId === 'undefined') {
        logger.error('Invalid channelId when trying to send message:', channelId);
        toast.error('Cannot send message: Invalid channel');
        throw new Error('Invalid channel ID');
      }
      
      logger.info(`Sending message to channel ${channelId}`);
      return sendChatMessage(channelId, message, user.id, parentId);
    },
    onSuccess: (response, variables) => {
      logger.info('Message sent successfully');
      // Invalidate relevant queries to fetch fresh data
      const { channelId, parentId } = variables;
      
      if (parentId) {
        // If replying to a thread, invalidate thread messages
        queryClient.invalidateQueries({ 
          queryKey: ['threadMessages', parentId] 
        });
      } else {
        // If posting to channel, invalidate channel messages
        queryClient.invalidateQueries({ 
          queryKey: ['chatMessages', channelId] 
        });
      }
    },
    onError: (error: any) => {
      logger.error('Failed to send message:', error);
      toast.error(error.message || 'Failed to send message. Please try again.');
    }
  });
};

/**
 * Hook for fetching thread replies
 */
export const useThreadMessages = (
  messageId: string | null | undefined,
  limit = 50,
  offset = 0
) => {
  const { isAuthenticated, user } = useAuth();
  
  // Validate messageId early
  const isValidMessageId = messageId && messageId !== 'null' && messageId !== 'undefined';

  return useQuery({
    queryKey: ['threadMessages', messageId, offset, limit],
    queryFn: async (): Promise<ApiResponse<ChatMessageWithAuthor[]>> => {
      if (!isValidMessageId) {
        logger.warn(`Invalid messageId provided: "${messageId}", returning empty array`);
        return createSuccessResponse([]);
      }

      if (!isAuthenticated || !user) {
        logger.warn('User is not authenticated for fetching thread messages');
        return createErrorResponse({ 
          code: 'auth_required', 
          message: 'Authentication required', 
          details: null 
        });
      }

      return getThreadReplies(messageId, limit, offset);
    },
    enabled: isValidMessageId && isAuthenticated,
    select: (response: ApiResponse<ChatMessageWithAuthor[]>) => {
      if (response.status === 'error' && response.error) {
        toast.error('Failed to load thread replies');
        logger.error('Error in useThreadMessages:', response.error);
        return [];
      }
      return response.data || [];
    }
  });
};

// Export a consolidated API
export const chatMessageApi2 = {
  getChannelMessages,
  getThreadReplies,
  sendChatMessage,
  ...chatMessageApi
};
