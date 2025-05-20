
import { createQueryHooks } from '@/hooks/core/factory';
import { chatMessageApi, getChannelMessages, getThreadReplies, sendChatMessage } from '@/api/chat/chatMessageApiFactory';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatMessageWithAuthor } from '@/types/chat';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import { ApiResponse } from '@/api/core/errorHandler';

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

  // Validate channelId early - if it's null/undefined/"null"/"undefined", don't even try to fetch
  const isValidChannelId = channelId && channelId !== 'null' && channelId !== 'undefined';

  // Add detailed logging for debugging the channelId
  logger.info(`useChannelMessages called with channelId: ${channelId} (type: ${typeof channelId}), isValid: ${isValidChannelId}`);

  return useQuery({
    queryKey: ['chatMessages', channelId, offset, limit],
    queryFn: async (): Promise<ApiResponse<ChatMessageWithAuthor[]>> => {
      if (!isAuthenticated || !user) {
        logger.warn('User is not authenticated for fetching messages');
        return { 
          data: [], 
          error: { code: 'auth_required', message: 'Authentication required', details: null }, 
          status: 'error' 
        };
      }

      // Enhanced validation for channelId - don't attempt API call with invalid values
      if (!isValidChannelId) {
        logger.warn(`Invalid channelId provided to useChannelMessages: "${channelId}", returning empty array`);
        return { data: [], error: null, status: 'success' };
      }
      
      // Log for debugging
      logger.info(`Fetching messages for channel: ${channelId} (user: ${user.id})`);
      return getChannelMessages(channelId, limit, offset);
    },
    // Only enable the query if we have both authentication and a valid channel ID
    enabled: isAuthenticated && !!user?.id && isValidChannelId,
    refetchInterval: 5000, // Poll every 5 seconds as backup for real-time
    select: (response: ApiResponse<ChatMessageWithAuthor[]>) => {
      logger.info(`Channel messages response status: ${response.status}, messages: ${response.data?.length || 0}`);
      if (response.status === 'error') {
        logger.error('Error in channel messages response:', response.error);
        toast.error(response.error?.message || 'Failed to load messages');
        return [];
      }
      return response.data || [];
    },
    meta: {
      // Use meta for additional options
      errorHandler: (error: Error) => {
        logger.error('Query error in useChannelMessages:', error);
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
      
      logger.info(`Sending message to channel ${channelId}: ${message} (user: ${user.id})`);
      const response = await sendChatMessage(channelId, message, user.id, parentId);
      
      if (response.status === 'error') {
        logger.error('Error in sendChatMessage API call:', response.error);
        throw new Error(response.error?.message || 'Failed to send message');
      }
      
      return response;
    },
    onSuccess: (response, variables) => {
      logger.info('Message sent successfully:', response);
      // Invalidate relevant queries to fetch fresh data
      const { channelId, parentId } = variables;
      
      if (parentId) {
        // If replying to a thread, invalidate thread messages
        queryClient.invalidateQueries({ 
          queryKey: ['threadMessages', parentId] 
        });

        // Also update the reply_count for the parent message in the channel messages
        const messagesKey = ['chatMessages', channelId];
        queryClient.setQueriesData(
          { queryKey: messagesKey, exact: false },
          (oldData: any) => {
            // If no data, return as is
            if (!oldData || !Array.isArray(oldData)) return oldData;
            
            // Find and update the parent message's reply count
            return oldData.map((message: ChatMessageWithAuthor) => {
              if (message.id === parentId) {
                const currentCount = message.reply_count || 0;
                return { ...message, reply_count: currentCount + 1 };
              }
              return message;
            });
          }
        );
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
  
  logger.info(`useThreadMessages called with messageId: ${messageId}, isValid: ${isValidMessageId}`);

  return useQuery({
    queryKey: ['threadMessages', messageId, offset, limit],
    queryFn: async (): Promise<ApiResponse<ChatMessageWithAuthor[]>> => {
      if (!isValidMessageId) {
        logger.warn(`Invalid messageId provided to useThreadMessages: "${messageId}", returning empty array`);
        return { data: [], error: null, status: 'success' };
      }

      if (!isAuthenticated || !user) {
        logger.warn('User is not authenticated for fetching thread messages');
        return { 
          data: [], 
          error: { code: 'auth_required', message: 'Authentication required', details: null }, 
          status: 'error' 
        };
      }

      logger.info(`Fetching thread replies for message: ${messageId} (user: ${user.id})`);
      return getThreadReplies(messageId, limit, offset);
    },
    enabled: isValidMessageId && isAuthenticated,
    refetchInterval: 10000, // Poll every 10 seconds as backup for real-time
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

/**
 * Hook for sending a reply in a thread
 */
export const useSendReply = () => {
  const sendMessageMutation = useSendMessage();
  
  return {
    ...sendMessageMutation,
    mutate: ({ channelId, message, parentId }: {
      channelId: string;
      message: string;
      parentId: string;
    }) => {
      return sendMessageMutation.mutate({ channelId, message, parentId });
    }
  };
};
