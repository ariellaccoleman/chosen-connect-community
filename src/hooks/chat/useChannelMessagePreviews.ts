
import { useQuery } from '@tanstack/react-query';
import { getChannelMessagePreviews } from '@/api/chat/chatMessageApiFactory';
import { ChatMessageWithAuthor } from '@/types/chat';

/**
 * Hook to get message previews for a chat channel
 */
export function useChannelMessagePreviews(channelId: string | null | undefined, limit = 3) {
  return useQuery({
    queryKey: ['chatMessagePreviews', channelId, limit],
    queryFn: async (): Promise<ChatMessageWithAuthor[]> => {
      if (!channelId) return [];
      
      const response = await getChannelMessagePreviews(channelId, limit);
      return response.data || [];
    },
    enabled: !!channelId,
  });
}
