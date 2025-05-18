
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatSidebar from '@/components/chat/ChatSidebar';
import MessageFeed from '@/components/chat/MessageFeed';
import ThreadPanel from '@/components/chat/ThreadPanel';
import { logger } from '@/utils/logger';
import { useChannelMessagesRealtime } from '@/hooks/chat';
import { ChatMessageWithAuthor } from '@/types/chat';
import ErrorBoundary from '@/components/common/ErrorBoundary';

const ChatPage = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const [selectedMessage, setSelectedMessage] = useState<ChatMessageWithAuthor | null>(null);
  const [isThreadOpen, setIsThreadOpen] = useState(false);

  // Setup real-time updates for the selected channel
  useChannelMessagesRealtime(channelId);

  const handleChannelSelect = (newChannelId: string) => {
    // Close thread panel when changing channels
    setSelectedMessage(null);
    setIsThreadOpen(false);
    navigate(`/chat/${newChannelId}`);
  };

  const handleMessageSelect = (message: ChatMessageWithAuthor) => {
    setSelectedMessage(message);
    setIsThreadOpen(true);
    logger.info('Selected message for thread:', message.id);
  };

  const handleCloseThread = () => {
    setIsThreadOpen(false);
  };

  return (
    <div className="h-[calc(100vh-64px)] pt-16 flex flex-col sm:flex-row bg-gray-50 dark:bg-gray-900">
      {/* Channel Sidebar */}
      <div className="w-full sm:w-64 md:w-72 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-sidebar overflow-y-auto">
        <ChatSidebar 
          selectedChannelId={channelId} 
          onSelectChannel={handleChannelSelect} 
        />
      </div>
      
      {/* Main Message Area */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isThreadOpen ? 'hidden md:flex' : ''}`}>
        {channelId ? (
          <MessageFeed 
            channelId={channelId}
            onMessageSelect={handleMessageSelect}
            selectedMessageId={selectedMessage?.id}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center bg-white dark:bg-gray-800">
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                Select a channel to start chatting
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Choose a channel from the sidebar
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Thread Panel (conditional) */}
      {isThreadOpen && selectedMessage && (
        <div className="w-full md:w-80 lg:w-96 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 flex flex-col overflow-hidden">
          <ThreadPanel 
            parentMessage={selectedMessage}
            channelId={channelId || ''}
            onClose={handleCloseThread}
          />
        </div>
      )}
    </div>
  );
};

const Chat = () => {
  return (
    <ErrorBoundary name="ChatPage">
      <ChatPage />
    </ErrorBoundary>
  );
};

export default Chat;
