
import React, { useEffect, useState } from 'react';
import { useChatChannels } from '@/hooks/chat/useChatChannels';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Loader, PlusCircle, MessageSquare } from 'lucide-react';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

interface ChatSidebarProps {
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  selectedChannelId, 
  onSelectChannel 
}) => {
  const { data: channels = [], isLoading, isError } = useChatChannels();
  const { isAuthenticated } = useAuth();
  const [initialLoad, setInitialLoad] = useState(true);

  // Enhanced logging for debugging
  logger.info(`ChatSidebar rendering - Selected Channel: ${selectedChannelId || 'none'}`);
  logger.info(`Channels loaded: ${channels.length}, isLoading: ${isLoading}, isError: ${isError}`);
  
  if (channels.length > 0) {
    logger.info('Available channels:', channels.map(c => ({ id: c.id, name: c.name })));
  }

  // Set a default channel on initial load if one isn't already selected
  useEffect(() => {
    if (!isLoading && channels.length > 0) {
      // If there's no selectedChannelId or it's invalid
      if (!selectedChannelId || selectedChannelId === 'null' || selectedChannelId === 'undefined') {
        const defaultChannel = channels[0];
        logger.info('Setting default channel:', defaultChannel.id, defaultChannel.name);
        onSelectChannel(defaultChannel.id);
        setInitialLoad(false);
      } else {
        // Verify selected channel exists in our channels list
        const channelExists = channels.some(c => c.id === selectedChannelId);
        if (!channelExists && initialLoad) {
          logger.info('Selected channel not found in channels list, resetting to default');
          onSelectChannel(channels[0].id);
        }
        
        if (initialLoad) {
          setInitialLoad(false);
        }
      }
    }
  }, [channels, isLoading, selectedChannelId, onSelectChannel, initialLoad]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center h-32">
        <Loader size={24} className="animate-spin text-gray-500" />
      </div>
    );
  }

  // Show error state
  if (isError || !isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 mb-2">
          {!isAuthenticated ? 'Login required' : 'Failed to load channels'}
        </p>
        <Button variant="outline" className="text-sm" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  // No channels found state
  if (channels.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-2">No channels found</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="px-4 pb-2 mb-2 border-b border-gray-100 dark:border-gray-800">
        <h2 className="font-semibold text-lg flex items-center justify-between">
          Channels
          {isAuthenticated && (
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <PlusCircle size={18} />
            </Button>
          )}
        </h2>
      </div>

      <div className="space-y-1 px-2">
        {channels.map(channel => (
          <button
            key={channel.id}
            onClick={() => {
              logger.info(`Channel selected: ${channel.id} (${channel.name})`);
              onSelectChannel(channel.id);
            }}
            className={cn(
              "w-full px-2 py-2 rounded-md flex items-center text-left transition-colors",
              selectedChannelId === channel.id
                ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <MessageSquare size={16} className="mr-2 shrink-0" />
            <span className="truncate flex-1">{channel.name || 'Unnamed Channel'}</span>
            {!channel.is_public && (
              <Badge variant="outline" className="ml-2 text-xs">Private</Badge>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatSidebar;
