
import React, { useEffect, useRef, useState } from 'react';
import { useChannelMessages, useSendMessage } from '@/hooks/chat';
import MessageCard from '@/components/chat/MessageCard';
import MessageInput from '@/components/chat/MessageInput';
import { Loader } from 'lucide-react';
import { useChat } from '@/hooks/chat/useChat';
import { ChatMessageWithAuthor } from '@/types/chat';

interface MessageFeedProps {
  channelId: string;
  onMessageSelect: (message: ChatMessageWithAuthor) => void;
  selectedMessageId?: string;
}

const MessageFeed: React.FC<MessageFeedProps> = ({ 
  channelId, 
  onMessageSelect,
  selectedMessageId
}) => {
  const { data: messages = [], isLoading } = useChannelMessages(channelId);
  const sendMessage = useSendMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const { activeChannel } = useChat();
  
  // Scroll to bottom when messages change if we're already at the bottom
  useEffect(() => {
    if (shouldScrollToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldScrollToBottom]);
  
  // Handle scroll events to determine if we should auto-scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // If we're at the bottom (or close), enable auto-scrolling
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldScrollToBottom(atBottom);
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      await sendMessage.mutateAsync({ 
        channelId,
        message: content
      });
      // Ensure we scroll to bottom after sending
      setShouldScrollToBottom(true);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <>
      {/* Channel header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold">
          # {activeChannel?.name || 'Loading...'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {activeChannel?.description || 'No description'}
        </p>
      </div>
      
      {/* Messages area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900"
        onScroll={handleScroll}
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader size={24} className="animate-spin text-gray-500" />
          </div>
        ) : messages.length > 0 ? (
          <>
            {messages.map(message => (
              <MessageCard 
                key={message.id} 
                message={message} 
                isSelected={message.id === selectedMessageId}
                onClick={() => onMessageSelect(message)}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No messages yet. Be the first to send a message!
            </p>
          </div>
        )}
      </div>
      
      {/* Message input */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <MessageInput 
          onSendMessage={handleSendMessage} 
          placeholder="Message this channel"
          isSubmitting={sendMessage.isPending}
        />
      </div>
    </>
  );
};

export default MessageFeed;
