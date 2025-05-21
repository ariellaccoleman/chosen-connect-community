
import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createQueryHooks } from '../core/factory/queryHookFactory';
import { chatChannelsApi, getChatChannelWithDetails, updateChannelTags } from '@/api/chat';
import { ChatChannel, ChatChannelCreate, ChatChannelUpdate, ChatChannelWithDetails } from '@/types/chat';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { EntityType } from '@/types/entityTypes';
import { TagAssignment } from '@/utils/tags/types';

// Create standard CRUD hooks using the factory
const chatChannelHooks = createQueryHooks(
  { name: 'chatChannel', pluralName: 'chatChannels', displayName: 'Chat Channel' },
  chatChannelsApi
);

// Modified hooks to ensure proper data handling
export const useChatChannels = (options?: { tagId?: string | null }) => {
  const result = chatChannelHooks.useList();
  
  // Use the tag ID to filter channels if provided
  const filteredData = options?.tagId 
    ? result.data?.data?.filter(channel => {
        // If channel has tags, check if one matches the requested tag ID
        return channel.tag_assignments?.some(ta => ta.tag_id === options.tagId);
      })
    : result.data?.data;
  
  // Transform the result to ensure data is an array
  // The original issue was that we weren't properly extracting the data from the ApiResponse
  return {
    ...result,
    data: Array.isArray(filteredData) 
      ? filteredData 
      : Array.isArray(result.data) 
        ? result.data 
        : [],
  };
};

export const useChatChannelById = (channelId: string | null | undefined) => {
  const result = chatChannelHooks.useById(channelId);
  
  // Return the raw response to handle ApiResponse<ChatChannel> type properly
  return result;
};

// Re-export other hooks with the original implementation
export const { 
  useCreate: useCreateChatChannel,
  useUpdate: useUpdateChatChannel,
  useDelete: useDeleteChatChannel
} = chatChannelHooks;

/**
 * Hook to get chat channel with details
 */
export function useChatChannelWithDetails(channelId: string | null | undefined) {
  return useQuery({
    queryKey: ['chatChannel', channelId, 'details'],
    queryFn: async () => {
      if (!channelId) return null;
      return getChatChannelWithDetails(channelId);
    },
    enabled: !!channelId,
    select: (response) => response?.data || null,
  });
}

/**
 * Enhanced hook to create chat channels with better error handling
 */
export function useEnhancedCreateChatChannel() {
  const queryClient = useQueryClient();
  const { mutate, isPending, isError, isSuccess, error } = useMutation({
    mutationFn: async (data: ChatChannelCreate) => {
      logger.info("Creating chat channel with data:", data);
      const result = await chatChannelsApi.create(data);
      logger.info("Create chat channel result:", result);
      return result;
    },
    onSuccess: (response) => {
      if (response.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['chatChannels'] });
        toast.success('Chat channel created successfully');
      } else if (response.error) {
        toast.error(`Failed to create chat channel: ${response.error.message}`);
      }
    },
    onError: (error) => {
      logger.error('Error creating chat channel:', error);
      toast.error('Failed to create chat channel: An unexpected error occurred');
    }
  });

  return { mutate, isPending, isError, isSuccess, error };
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

/**
 * Hook to get chat channels filtered by tag ID
 */
export function useChatChannelsByTag(tagId: string | null | undefined) {
  return useQuery({
    queryKey: ['chatChannels', 'byTag', tagId],
    queryFn: async () => {
      if (!tagId) return [];
      
      // Get all channels
      const channelsResult = await chatChannelsApi.getAll();
      if (channelsResult.error || !Array.isArray(channelsResult.data)) {
        return [];
      }
      
      // Get all tag assignments for the channels
      const { createRepository } = await import('@/api/core/repository');
      const tagAssignmentsRepo = createRepository('tag_assignments');
      const { data: tagAssignments, error } = await tagAssignmentsRepo
        .select('*')
        .eq('tag_id', tagId)
        .eq('target_type', 'chat')
        .execute();
      
      if (error || !tagAssignments) {
        return [];
      }
      
      // Filter channels by the ones that have tag assignments matching the tag ID
      const channelIds = tagAssignments.map((ta: any) => ta.target_id);
      const filteredChannels = channelsResult.data.filter(
        channel => channelIds.includes(channel.id)
      );
      
      return filteredChannels;
    },
    enabled: !!tagId
  });
}
