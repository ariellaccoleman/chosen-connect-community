
import React, { useRef, useEffect } from 'react';
import { ChatMessageWithAuthor } from '@/types/chat';
import MessageCard from './MessageCard';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { logger } from '@/utils/logger';

interface MessageListProps {
  messages: ChatMessageWithAuthor[];
  isLoading: boolean;
  error: unknown;
  emptyMessage?: string;
  onMessageSelect?: (message: ChatMessageWithAuthor) => void;
  selectedMessageId?: string;
  showReplies?: boolean;
  onScroll?: (isNearBottom: boolean) => void;
  autoScroll?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  error,
  emptyMessage = 'No messages yet',
  onMessageSelect,
  selectedMessageId,
  showReplies = true,
  onScroll,
  autoScroll = true
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom on new messages if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && listRef.current && messages.length > 0) {
      const listElement = listRef.current;
      listElement.scrollTop = listElement.scrollHeight;
    }
  }, [messages, autoScroll]);
  
  // Handle manual scroll interaction
  const handleScroll = () => {
    if (!listRef.current || !onScroll) return;
    
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    onScroll(isNearBottom);
  };
  
  // Handle error states
  if (error) {
    logger.error('Error loading messages:', error);
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Failed to load messages</h3>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      ref={listRef}
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
            showReplies={showReplies}
          />
        ))
      ) : (
        // No messages
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>{emptyMessage}</p>
            <p className="text-sm mt-2">Start the conversation below</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
