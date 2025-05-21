
import React from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useAuth } from '@/hooks/useAuth';
import { useChatContext } from '@/contexts/ChatContext';
import { useTimestampRefresh } from '@/hooks/useTimestampRefresh';
import { ChatMessageWithAuthor } from '@/types/chat';

const MessageFeed: React.FC = () => {
  const { user } = useAuth();
  const { 
    channelId,
    messages,
    messagesLoading,
    messagesError,
    setSelectedMessage,
    selectedMessage,
    toggleThread,
    setAutoScrollMessages,
    autoScrollMessages,
  } = useChatContext();
  
  const { refreshTimestamps } = useTimestampRefresh();
  
  // Handle message selection and open thread panel
  const handleMessageSelect = (message: ChatMessageWithAuthor) => {
    setSelectedMessage(message);
    toggleThread(true);
  };
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <h2 className="font-medium">Messages</h2>
      </div>
      
      {/* Message list - using our new shared component */}
      <MessageList
        messages={messages}
        isLoading={messagesLoading}
        error={messagesError}
        onMessageSelect={handleMessageSelect}
        selectedMessageId={selectedMessage?.id}
        onScroll={(isNearBottom) => setAutoScrollMessages(isNearBottom)}
        autoScroll={autoScrollMessages}
      />
      
      {/* Message input */}
      {user && channelId && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <MessageInput 
            channelId={channelId} 
            userId={user.id} 
            onMessageSent={() => setAutoScrollMessages(true)} 
          />
        </div>
      )}
    </div>
  );
};

export default MessageFeed;
