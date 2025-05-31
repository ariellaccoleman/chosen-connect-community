
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
      const result = await getChatChannelWithDetails(channelId);
      if (result.error) {
        throw new Error(result.error.message || "Failed to fetch channel details");
      }
      return result.data;
    },
    enabled: !!channelId,
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
      if (result.error) {
        throw new Error(result.error.message || "Failed to create chat channel");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatChannels'] });
      toast.success('Chat channel created successfully');
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
      const result = await updateChannelTags(channelId, tagIds);
      if (result.error) {
        throw new Error(result.error.message || "Failed to update channel tags");
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chatChannel', variables.channelId, 'details'] });
      queryClient.invalidateQueries({ queryKey: ['chatChannels'] });
      toast.success('Channel tags updated successfully');
    },
    onError: (error) => {
      logger.error('Error updating channel tags:', error);
      toast.error('Failed to update channel tags: An unexpected error occurred');
    }
  });
}

/**
 * Hook to get chat channels filtered by tag ID - fixed implementation
 */
export function useChatChannelsByTag(tagId: string | null | undefined) {
  return useQuery({
    queryKey: ['chatChannels', 'byTag', tagId],
    queryFn: async () => {
      if (!tagId) return [];
      
      try {
        // Get all channels with their tag assignments
        const channelsResult = await chatChannelsApi.getAll({
          // Use proper select to include tag assignments
          select: '*, tag_assignments(*, tag:tags(*))'
        });
        
        if (channelsResult.error || !Array.isArray(channelsResult.data)) {
          logger.error("Error fetching channels:", channelsResult.error);
          return [];
        }
        
        // Filter channels by those that have assignments for this tag
        const filteredChannels = channelsResult.data.filter(channel => {
          if (!channel.tag_assignments || !Array.isArray(channel.tag_assignments)) {
            return false;
          }
          return channel.tag_assignments.some(assignment => assignment.tag_id === tagId);
        });
        
        logger.debug(`Found ${filteredChannels.length} channels for tag ${tagId}`);
        return filteredChannels;
      } catch (error) {
        logger.error("Error in useChatChannelsByTag:", error);
        return [];
      }
    },
    enabled: !!tagId
  });
}
