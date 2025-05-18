
import React, { useEffect } from 'react';
import { useThreadMessages, useSendMessage } from '@/hooks/chat';
import { ChatMessageWithAuthor } from '@/types/chat';
import MessageCard from './MessageCard';
import MessageInput from './MessageInput';
import { ChevronLeft, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThreadRepliesRealtime } from '@/hooks/chat/useChatRealtime';

interface ThreadPanelProps {
  parentMessage: ChatMessageWithAuthor;
  channelId: string;
  onClose: () => void;
}

const ThreadPanel: React.FC<ThreadPanelProps> = ({ parentMessage, channelId, onClose }) => {
  const { data: replies = [], isLoading } = useThreadMessages(parentMessage.id);
  const sendMessage = useSendMessage();

  // Setup real-time updates for this thread
  useThreadRepliesRealtime(parentMessage.id);

  const handleSendReply = async (content: string) => {
    if (!content.trim()) return;

    try {
      await sendMessage.mutateAsync({
        channelId,
        message: content,
        parentId: parentMessage.id
      });
    } catch (error) {
      console.error('Failed to send reply:', error);
    }
  };

  return (
    <>
      {/* Thread header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-md font-medium">Thread</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-8 w-8"
          >
            <ChevronLeft size={16} />
            <span className="sr-only">Close thread</span>
          </Button>
        </div>
      </div>
      
      {/* Thread parent message */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <MessageCard 
          message={parentMessage} 
          showReplies={false}
        />
      </div>

      {/* Thread replies */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-gray-50 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex justify-center items-center h-20">
            <Loader size={20} className="animate-spin text-gray-500" />
          </div>
        ) : replies.length > 0 ? (
          replies.map(reply => (
            <MessageCard 
              key={reply.id} 
              message={reply} 
              showReplies={false}
            />
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No replies yet. Start the conversation!
            </p>
          </div>
        )}
      </div>
      
      {/* Reply input */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <MessageInput 
          onSendMessage={handleSendReply} 
          placeholder="Reply in thread..."
          isSubmitting={sendMessage.isPending}
          autoFocus
        />
      </div>
    </>
  );
};

export default ThreadPanel;
