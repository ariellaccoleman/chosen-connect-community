
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
  return useQuery({
    queryKey: ['chatMessages', channelId, offset, limit],
    queryFn: () => getChannelMessages(channelId as string, limit, offset),
    enabled: !!channelId,
    refetchInterval: 10000, // Poll every 10 seconds as backup for real-time
    select: (response) => response.data || [],
  });
};

/**
 * Hook for sending a new message to a channel
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ channelId, message, parentId }: { 
      channelId: string; 
      message: string;
      parentId?: string | null;
    }) => {
      if (!user?.id) {
        throw new Error('User is not authenticated');
      }

      return sendChatMessage(channelId, message, user.id, parentId);
    },
    onSuccess: (_, variables) => {
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
    onError: (error) => {
      logger.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
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
  return useQuery({
    queryKey: ['threadMessages', messageId, offset, limit],
    queryFn: () => getThreadReplies(messageId as string, limit, offset),
    enabled: !!messageId,
    refetchInterval: 10000, // Poll every 10 seconds as backup for real-time
    select: (response) => response.data || [],
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
