
import React from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChatContext } from '@/contexts/ChatContext';
import { useTimestampRefresh } from '@/hooks/useTimestampRefresh';

const MessageFeed: React.FC = () => {
  const { user } = useAuth();
  const { 
    channelId,
    messages,
    messagesLoading,
    messagesError,
    setSelectedMessage,
    selectedMessage,
    setAutoScrollMessages,
    autoScrollMessages,
  } = useChatContext();
  
  const { refreshTimestamps } = useTimestampRefresh();
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <h2 className="font-medium">Messages</h2>
        <Button variant="ghost" size="sm" onClick={refreshTimestamps} title="Refresh timestamps if they appear incorrect">
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh Times
        </Button>
      </div>
      
      {/* Message list - using our new shared component */}
      <MessageList
        messages={messages}
        isLoading={messagesLoading}
        error={messagesError}
        onMessageSelect={setSelectedMessage}
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
