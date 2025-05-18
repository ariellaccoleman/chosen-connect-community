
import React, { useEffect, useRef, useState } from 'react';
import { useThreadMessages, useSendReply } from '@/hooks/chat/useChatMessageFactory';
import { useThreadRepliesRealtime } from '@/hooks/chat/useChatRealtime';
import { ChatMessageWithAuthor } from '@/types/chat';
import MessageCard from './MessageCard';
import MessageInput from './MessageInput';
import { X, Loader, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/utils/logger';

interface ThreadPanelProps {
  parentMessage: ChatMessageWithAuthor;
  channelId: string;
  onClose: () => void;
}

const ThreadPanel: React.FC<ThreadPanelProps> = ({ parentMessage, channelId, onClose }) => {
  const { data: replies = [], isLoading, isError, error, refetch } = useThreadMessages(parentMessage.id);
  const sendReply = useSendReply();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  
  // Setup real-time updates for the thread
  useThreadRepliesRealtime(parentMessage.id);
  
  // Scroll to bottom when replies change if we're already at the bottom
  useEffect(() => {
    if (shouldScrollToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [replies, shouldScrollToBottom]);
  
  // Handle scroll events to determine if we should auto-scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // If we're at the bottom (or close), enable auto-scrolling
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldScrollToBottom(atBottom);
  };

  const handleSendReply = async (content: string) => {
    if (!content.trim()) return;

    try {
      // Ensure we have valid IDs
      if (!parentMessage.id || !channelId) {
        throw new Error("Missing required IDs for replying");
      }
      
      logger.info(`Sending reply to message ${parentMessage.id}: ${content}`);
      
      // Send the reply
      await sendReply.mutateAsync({ 
        channelId,
        message: content,
        parentId: parentMessage.id
      });
      
      // Force refetch replies after sending
      await refetch();
      
      // Ensure we scroll to bottom after sending
      setShouldScrollToBottom(true);
    } catch (error) {
      logger.error('Failed to send reply:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Thread header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
        <h3 className="text-lg font-medium">Thread</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X size={18} />
          <span className="sr-only">Close thread</span>
        </Button>
      </div>
      
      {/* Parent message */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <MessageCard message={parentMessage} showReplies={false} />
      </div>
      
      {/* Replies */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900"
        onScroll={handleScroll}
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader size={24} className="animate-spin text-gray-500" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center text-center py-8">
            <AlertCircle size={32} className="text-red-500 mb-2" />
            <p className="text-red-500 font-medium">Error loading replies</p>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {error?.message || 'Something went wrong'}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        ) : replies.length > 0 ? (
          <>
            {replies.map(reply => (
              <MessageCard key={reply.id} message={reply} showReplies={false} />
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No replies yet. Start the conversation!
            </p>
          </div>
        )}
      </div>
      
      {/* Reply input */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <MessageInput 
          onSendMessage={handleSendReply} 
          placeholder="Reply to thread..."
          isSubmitting={sendReply.isPending}
          autoFocus
        />
      </div>
    </div>
  );
};

export default ThreadPanel;
