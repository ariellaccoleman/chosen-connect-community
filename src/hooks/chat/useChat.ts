
import { useParams } from 'react-router-dom';
import { useChatChannelById } from './useChatChannels';

/**
 * Hook for accessing chat context data
 */
export const useChat = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const { data: activeChannel } = useChatChannelById(channelId);

  return {
    channelId,
    activeChannel
  };
};
