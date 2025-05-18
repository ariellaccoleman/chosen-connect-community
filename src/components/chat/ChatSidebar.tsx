
import React, { useState } from 'react';
import { useChatChannels } from '@/hooks/chat';
import { Loader, Plus } from 'lucide-react';
import { APP_ROUTES } from '@/config/routes';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ChatChannel } from '@/types/chat';

interface ChatSidebarProps {
  selectedChannelId?: string;
  onSelectChannel: (channelId: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ selectedChannelId, onSelectChannel }) => {
  const { data: channels = [], isLoading } = useChatChannels();
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter channels based on search term
  const filteredChannels = channels.filter(channel => 
    channel.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('Chat channels loaded:', channels.length, channels);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Channels</h2>
          {isAdmin && (
            <Link 
              to={APP_ROUTES.CREATE_CHAT_CHANNEL}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              title="Create Channel"
            >
              <Plus size={20} className="text-gray-500 dark:text-gray-400" />
            </Link>
          )}
        </div>
        <input
          type="text"
          placeholder="Search channels..."
          className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <Loader size={24} className="animate-spin text-gray-500" />
          </div>
        ) : filteredChannels.length > 0 ? (
          <ul className="space-y-1">
            {filteredChannels.map(channel => (
              <li 
                key={channel.id}
                onClick={() => onSelectChannel(channel.id)}
                className={`
                  p-2 rounded-md cursor-pointer
                  ${selectedChannelId === channel.id 
                    ? 'bg-chosen-blue/10 text-chosen-blue dark:bg-chosen-blue/20' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <div className="flex items-center">
                  <span className="text-sm font-medium truncate">
                    # {channel.name}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center p-4 text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No matching channels' : 'No channels available'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
