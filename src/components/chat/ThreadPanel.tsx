
import React from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Button } from '@/components/ui/button';
import { X, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChatContext } from '@/contexts/ChatContext';
import { useTimestampRefresh } from '@/hooks/useTimestampRefresh';

const ThreadPanel: React.FC = () => {
  const { user } = useAuth();
  const { 
    channelId, 
    selectedMessage, 
    threadMessages, 
    threadMessagesLoading, 
    threadMessagesError,
    toggleThread,
    autoScrollThread,
    setAutoScrollThread
  } = useChatContext();
  
  const { refreshTimestamps } = useTimestampRefresh();
  
  if (!selectedMessage || !channelId) return null;
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <h2 className="font-medium">Thread</h2>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={refreshTimestamps} title="Refresh timestamps if they appear incorrect">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => toggleThread(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Parent message */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
          <MessageList
            messages={[selectedMessage]}
            isLoading={false}
            error={null}
            showReplies={false}
            autoScroll={false}
          />
        </div>
        
        {/* Thread replies */}
        <MessageList
          messages={threadMessages}
          isLoading={threadMessagesLoading}
          error={threadMessagesError}
          emptyMessage="No replies yet"
          showReplies={false}
          onScroll={(isNearBottom) => setAutoScrollThread(isNearBottom)}
          autoScroll={autoScrollThread}
        />
        
        {/* Reply input */}
        {user && (
          <div className="border-t border-gray-200 dark:border-gray-800 p-4">
            <MessageInput 
              channelId={channelId} 
              userId={user.id} 
              parentId={selectedMessage.id}
              onMessageSent={() => setAutoScrollThread(true)}
              placeholder="Reply to thread..."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadPanel;
