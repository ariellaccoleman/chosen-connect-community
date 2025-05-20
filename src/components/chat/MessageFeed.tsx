
import React, { useState, useRef, useEffect } from 'react';
import { useChannelMessages } from '@/hooks/chat';
import MessageCard from './MessageCard';
import MessageInput from './MessageInput';
import { ChatMessageWithAuthor } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import { Skeleton } from '@/components/ui/skeleton';
import { useTimestampRefresh } from '@/hooks/useTimestampRefresh';

interface MessageFeedProps {
  channelId: string | null;
  onMessageSelect?: (message: ChatMessageWithAuthor) => void;
  selectedMessageId?: string;
}

const MessageFeed: React.FC<MessageFeedProps> = ({
  channelId,
  onMessageSelect,
  selectedMessageId
}) => {
  const feedRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [autoScroll, setAutoScroll] = useState(true);
  const { refreshTimestamps } = useTimestampRefresh();
  
  const {
    messages,
    isLoading,
    isError,
    error
  } = useChannelMessages(channelId);
  
  // Scroll to bottom on new messages if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && feedRef.current && messages?.length > 0) {
      const feedElement = feedRef.current;
      feedElement.scrollTop = feedElement.scrollHeight;
    }
  }, [messages, autoScroll]);
  
  // Handle manual scroll interaction
  const handleScroll = () => {
    if (!feedRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    // Only update autoScroll if the value would change (prevents unnecessary re-renders)
    if (autoScroll !== isNearBottom) {
      setAutoScroll(isNearBottom);
    }
  };
  
  // Handle error states
  if (isError) {
    logger.error('Error loading messages:', error);
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
            <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Failed to load messages</h3>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <h2 className="font-medium">Messages</h2>
        <Button variant="ghost" size="sm" onClick={refreshTimestamps} title="Refresh timestamps if they appear incorrect">
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh Times
        </Button>
      </div>
      
      {/* Message list */}
      <div 
        ref={feedRef}
        className="flex-1 overflow-y-auto p-4"
        onScroll={handleScroll}
      >
        {isLoading ? (
          // Loading state
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : messages && messages.length > 0 ? (
          // Messages loaded successfully
          messages.map(message => (
            <MessageCard
              key={message.id}
              message={message}
              isSelected={message.id === selectedMessageId}
              onClick={onMessageSelect ? () => onMessageSelect(message) : undefined}
            />
          ))
        ) : (
          // No messages
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p>No messages yet</p>
              <p className="text-sm mt-2">Start the conversation below</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Message input */}
      {user && channelId && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <MessageInput channelId={channelId} userId={user.id} onMessageSent={() => setAutoScroll(true)} />
        </div>
      )}
    </div>
  );
};

export default MessageFeed;
