
import { useParams } from 'react-router-dom';
import { useChatChannelById } from './useChatChannels';
import { ChatChannel } from '@/types/chat';
import { ApiResponse } from '@/api/core/errorHandler';

/**
 * Hook for accessing chat context data
 */
export const useChat = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const { data: activeChannel } = useChatChannelById(channelId);

  // Check if activeChannel is an ApiResponse or a direct ChatChannel
  const channel = activeChannel && 
    typeof activeChannel === 'object' && 
    'data' in activeChannel ? 
    (activeChannel as ApiResponse<ChatChannel>).data : 
    (activeChannel as ChatChannel | null);

  return {
    channelId,
    activeChannel: channel
  };
};
