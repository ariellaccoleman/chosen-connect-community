
import { useParams } from 'react-router-dom';
import { useChatChannelById } from './useChatChannels';
import { ChatChannel } from '@/types/chat';

/**
 * Hook for accessing chat context data
 */
export const useChat = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const { data: activeChannel } = useChatChannelById(channelId);

  return {
    channelId,
    activeChannel: activeChannel as ChatChannel | null
  };
};
