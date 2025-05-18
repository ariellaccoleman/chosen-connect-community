
import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createQueryHooks } from '../core/factory/queryHookFactory';
import { chatChannelsApi, createChannelWithTags, updateChannelTags } from '@/api/chat';
import { ChatChannel, ChatChannelCreate, ChatChannelWithDetails } from '@/types/chat';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// Create standard CRUD hooks using the factory
export const {
  useList: useChatChannels,
  useById: useChatChannelById,
  useCreate: useCreateChatChannel,
  useUpdate: useUpdateChatChannel,
  useDelete: useDeleteChatChannel
} = createQueryHooks(
  { name: 'chatChannel', pluralName: 'chatChannels', displayName: 'Chat Channel' },
  chatChannelsApi
);

/**
 * Hook to create a chat channel with tags
 */
export function useCreateChannelWithTags() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createChannelWithTags,
    onSuccess: (response) => {
      if (response.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['chatChannels'] });
        toast.success('Chat channel created successfully');
      } else if (response.error) {
        toast.error(`Failed to create channel: ${response.error.message}`);
      }
    },
    onError: (error) => {
      logger.error('Error creating chat channel with tags:', error);
      toast.error('Failed to create channel: An unexpected error occurred');
    }
  });
}

/**
 * Hook to get chat channel with details
 */
export function useChatChannelWithDetails(channelId: string | null | undefined) {
  return useQuery({
    queryKey: ['chatChannel', channelId, 'details'],
    queryFn: async () => {
      if (!channelId) return null;
      const { getChatChannelWithDetails } = await import('@/api/chat/chatChannelsApi');
      return getChatChannelWithDetails(channelId);
    },
    enabled: !!channelId
  });
}

/**
 * Hook to update channel tags
 */
export function useUpdateChannelTags() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ channelId, tagIds }: { channelId: string; tagIds: string[] }) => {
      return updateChannelTags(channelId, tagIds);
    },
    onSuccess: (response, variables) => {
      if (response.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['chatChannel', variables.channelId, 'details'] });
        queryClient.invalidateQueries({ queryKey: ['chatChannels'] });
        toast.success('Channel tags updated successfully');
      } else if (response.error) {
        toast.error(`Failed to update channel tags: ${response.error.message}`);
      }
    },
    onError: (error) => {
      logger.error('Error updating channel tags:', error);
      toast.error('Failed to update channel tags: An unexpected error occurred');
    }
  });
}
