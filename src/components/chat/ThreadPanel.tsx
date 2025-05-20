
import React, { useState, useRef, useEffect } from 'react';
import { useThreadReplies } from '@/hooks/chat';
import { ChatMessageWithAuthor } from '@/types/chat';
import MessageCard from './MessageCard';
import MessageInput from './MessageInput';
import { Button } from '@/components/ui/button';
import { X, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/utils/logger';
import { useTimestampRefresh } from '@/hooks/useTimestampRefresh';

interface ThreadPanelProps {
  parentMessage: ChatMessageWithAuthor;
  channelId: string;
  onClose: () => void;
}

const ThreadPanel: React.FC<ThreadPanelProps> = ({
  parentMessage,
  channelId,
  onClose
}) => {
  const { user } = useAuth();
  const [autoScroll, setAutoScroll] = useState(true);
  const threadRef = useRef<HTMLDivElement>(null);
  const { refreshTimestamps } = useTimestampRefresh();
  
  const {
    replies,
    isLoading,
    isError,
    error
  } = useThreadReplies(parentMessage.id);
  
  // Scroll to bottom on new messages if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && threadRef.current && replies?.length > 0) {
      const threadElement = threadRef.current;
      threadElement.scrollTop = threadElement.scrollHeight;
    }
  }, [replies, autoScroll]);
  
  // Handle manual scroll interaction
  const handleScroll = () => {
    if (!threadRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = threadRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    // Only update autoScroll if the value would change (prevents unnecessary re-renders)
    if (autoScroll !== isNearBottom) {
      setAutoScroll(isNearBottom);
    }
  };
  
  // Handle error states
  if (isError) {
    logger.error('Error loading thread replies:', error);
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h2 className="font-medium">Thread</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
            <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Failed to load thread</h3>
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
        <h2 className="font-medium">Thread</h2>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={refreshTimestamps} title="Refresh timestamps if they appear incorrect">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Parent message */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
          <MessageCard message={parentMessage} showReplies={false} />
        </div>
        
        {/* Thread replies */}
        <div 
          ref={threadRef}
          className="flex-1 overflow-y-auto p-4"
          onScroll={handleScroll}
        >
          {isLoading ? (
            // Loading state
            <div className="space-y-4">
              {Array(2).fill(0).map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : replies && replies.length > 0 ? (
            // Replies loaded successfully
            replies.map(reply => (
              <MessageCard key={reply.id} message={reply} showReplies={false} />
            ))
          ) : (
            // No replies
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <p>No replies yet</p>
                <p className="text-sm mt-2">Start the thread below</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Reply input */}
        {user && (
          <div className="border-t border-gray-200 dark:border-gray-800 p-4">
            <MessageInput 
              channelId={channelId} 
              userId={user.id} 
              parentId={parentMessage.id}
              onMessageSent={() => setAutoScroll(true)}
              placeholder="Reply to thread..."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadPanel;
