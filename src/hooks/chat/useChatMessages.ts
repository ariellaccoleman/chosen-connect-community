
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChannelMessages, sendChatMessage, getThreadReplies } from '@/api/chat/chatMessagesApi';
import { ChatMessageCreate, ChatMessageWithAuthor } from '@/types/chat';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/api/core/errorHandler';
import { toast } from 'sonner';

/**
 * Hook for fetching channel messages
 */
export const useChannelMessages = (
  channelId: string | null | undefined,
  limit = 50,
  offset = 0
) => {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: ['chatMessages', channelId, offset, limit],
    queryFn: async () => {
      if (!channelId || channelId === 'null' || channelId === 'undefined') {
        logger.warn('No valid channelId provided to useChannelMessages');
        return { data: [] };
      }

      if (!isAuthenticated || !user) {
        logger.warn('User is not authenticated for fetching messages');
        toast.error('Authentication required to view messages');
        throw new Error('Authentication required');
      }

      logger.info(`Fetching messages for channel: ${channelId} (user: ${user.id})`);
      return getChannelMessages(channelId, limit, offset);
    },
    enabled: !!channelId && channelId !== 'null' && channelId !== 'undefined' && isAuthenticated,
    refetchInterval: 10000, // Poll every 10 seconds as backup for real-time
    select: (response) => {
      logger.info('Channel messages response:', response);
      return response.data || [];
    },
    meta: {
      onError: (error: any) => {
        const errorMessage = error?.message || 'Failed to load messages';
        toast.error(errorMessage);
        logger.error('Error in useChannelMessages:', error);
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

  return useQuery({
    queryKey: ['threadMessages', messageId, offset, limit],
    queryFn: async () => {
      if (!messageId) {
        return { data: [] };
      }

      if (!isAuthenticated || !user) {
        logger.warn('User is not authenticated for fetching thread messages');
        throw new Error('Authentication required');
      }

      logger.info(`Fetching thread replies for message: ${messageId} (user: ${user.id})`);
      return getThreadReplies(messageId as string, limit, offset);
    },
    enabled: !!messageId && isAuthenticated,
    refetchInterval: 10000, // Poll every 10 seconds as backup for real-time
    select: (response) => response.data || [],
    meta: {
      onError: (error: any) => {
        toast.error('Failed to load thread replies');
        logger.error('Error in useThreadMessages:', error);
      }
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
