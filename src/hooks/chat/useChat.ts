
import { useParams } from 'react-router-dom';
import { useChatChannelById } from './useChatChannels';
import { ChatChannel } from '@/types/chat';
import { ApiResponse } from '@/api/core/errorHandler';

/**
 * Hook for accessing chat context data
 */
export const useChat = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const { data: activeChannelResponse } = useChatChannelById(channelId);

  // Extract the channel data from the API response
  // This properly handles the type conversion by accessing the data property
  const channel = activeChannelResponse && 
    typeof activeChannelResponse === 'object' && 
    'data' in activeChannelResponse ? 
    activeChannelResponse.data : null;

  return {
    channelId,
    activeChannel: channel
  };
};
