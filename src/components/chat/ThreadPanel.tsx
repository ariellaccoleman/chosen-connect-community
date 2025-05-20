import React, { useEffect, useRef } from 'react';
import { useThreadMessages, useSendReply } from '@/hooks/chat/useChatMessageFactory';
import { ChatMessageWithAuthor } from '@/types/chat';
import MessageCard from '@/components/chat/MessageCard';
import MessageInput from '@/components/chat/MessageInput';
import { X, Loader, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/utils/logger';
import { useThreadRepliesRealtime } from '@/hooks/chat/useChatRealtime';

interface ThreadPanelProps {
  parentMessage: ChatMessageWithAuthor;
  channelId: string;
  onClose: () => void;
}

const ThreadPanel: React.FC<ThreadPanelProps> = ({ parentMessage, channelId, onClose }) => {
  const { data: replies = [], isLoading, isError, refetch } = useThreadMessages(parentMessage.id);
  const sendReply = useSendReply();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Set up real-time updates for this thread
  useThreadRepliesRealtime(parentMessage.id);
  
  // Scroll to bottom when new replies come in
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [replies]);
  
  const handleSendReply = async (content: string) => {
    if (!content.trim()) return;
    
    try {
      logger.info(`Sending reply to message ${parentMessage.id}: ${content}`);
      
      await sendReply.mutateAsync({
        channelId,
        message: content,
        parentId: parentMessage.id
      });
      
      // Force refetch after sending
      await refetch();
      
      // Scroll to bottom after sending
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
      
    } catch (error) {
      logger.error('Failed to send reply:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
        <h3 className="font-medium">Thread</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Thread messages */}
      <div className="flex-1 overflow-y-auto p-4" ref={messagesContainerRef}>
        {/* Parent Message */}
        <div className="pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
          <MessageCard 
            message={parentMessage} 
            showReplies={false} 
          />
        </div>
        
        {/* Replies */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader size={24} className="animate-spin text-gray-500" />
          </div>
        ) : isError ? (
          <div className="text-center py-8">
            <AlertCircle size={24} className="mx-auto mb-2 text-red-500" />
            <p className="text-red-500">Error loading replies</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()} 
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        ) : replies.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No replies yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {replies.map((reply) => (
              <MessageCard 
                key={reply.id} 
                message={reply} 
                showReplies={false}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Reply input */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <MessageInput 
          onSendMessage={handleSendReply}
          placeholder="Reply in thread"
          isSubmitting={sendReply.isPending}
        />
      </div>
    </div>
  );
};

export default ThreadPanel;
