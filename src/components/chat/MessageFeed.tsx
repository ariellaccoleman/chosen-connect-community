
import React, { useEffect, useRef, useState } from 'react';
import { useChannelMessages, useSendMessage } from '@/hooks/chat/useChatMessageFactory';
import MessageCard from '@/components/chat/MessageCard';
import MessageInput from '@/components/chat/MessageInput';
import { Loader, AlertCircle } from 'lucide-react';
import { useChat } from '@/hooks/chat/useChat';
import { ChatMessageWithAuthor } from '@/types/chat';
import { logger } from '@/utils/logger';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

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
  const { data: messages = [], isLoading, isError, error, refetch } = useChannelMessages(channelId);
  const sendMessage = useSendMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const { activeChannel } = useChat();
  const viewportRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(true);
  
  logger.info(`MessageFeed - Channel: ${channelId}, Messages count: ${messages.length}`);
  
  // Initial scroll to bottom on first load and when messages change
  useEffect(() => {
    // Scroll on initial load or when we should scroll to bottom
    if ((initialLoadRef.current || shouldScrollToBottom) && viewportRef.current && messages.length > 0) {
      const scrollToBottom = () => {
        if (viewportRef.current) {
          viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
          logger.info(`Scrolling to bottom - initial load: ${initialLoadRef.current}`);
        }
      };

      // Scroll immediately and then with a delay to ensure DOM is updated
      scrollToBottom();
      
      // Small delay to ensure DOM is updated
      setTimeout(scrollToBottom, 50);
      
      // Set initial load to false after first render
      if (initialLoadRef.current) {
        initialLoadRef.current = false;
      }
    }
  }, [messages, shouldScrollToBottom]);
  
  // Handle scroll events to determine if we should auto-scroll
  const handleScroll = () => {
    if (!viewportRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
    // If we're at the bottom (or close), enable auto-scrolling
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldScrollToBottom(atBottom);
    logger.info(`Scroll position: ${scrollTop}, scrollHeight: ${scrollHeight}, clientHeight: ${clientHeight}, atBottom: ${atBottom}`);
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      logger.info(`Sending message in channel ${channelId}: ${content}`);
      
      // Force scroll to bottom when sending a new message
      setShouldScrollToBottom(true);
      
      await sendMessage.mutateAsync({ 
        channelId,
        message: content
      });
      
      // Force refetch messages after sending
      await refetch();
      
      // Ensure we scroll after message is sent and displayed
      const forcedScrollToBottom = () => {
        if (viewportRef.current) {
          viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
          logger.info('Forced scroll to bottom after sending message');
        }
      };
      
      // Try multiple times with increasing delays to ensure scroll happens after render
      forcedScrollToBottom();
      setTimeout(forcedScrollToBottom, 50);
      setTimeout(forcedScrollToBottom, 150);
      
    } catch (error) {
      logger.error('Failed to send message:', error);
    }
  };

  // Extract the channel data from activeChannel response
  const channelName = activeChannel?.name || 'Loading...';
  const channelDescription = activeChannel?.description || 'No description';

  return (
    <div className="flex flex-col h-full">
      {/* Channel header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold">
          # {channelName}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {channelDescription}
        </p>
      </div>
      
      {/* Messages area */}
      <ScrollArea className="flex-1 bg-gray-50 dark:bg-gray-900">
        <ScrollAreaPrimitive.Viewport
          ref={viewportRef}
          className="h-full w-full"
          onScroll={handleScroll}
        >
          <div className="p-4 min-h-full flex flex-col justify-end">
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader size={24} className="animate-spin text-gray-500" />
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <AlertCircle size={32} className="text-red-500 mb-2" />
                  <p className="text-red-500 font-medium">Error loading messages</p>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {error?.message || 'Something went wrong'}
                  </p>
                  <Button onClick={() => refetch()} variant="outline">
                    Try Again
                  </Button>
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
          </div>
        </ScrollAreaPrimitive.Viewport>
      </ScrollArea>
      
      {/* Message input */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <MessageInput 
          onSendMessage={handleSendMessage} 
          placeholder="Message this channel"
          isSubmitting={sendMessage.isPending}
        />
      </div>
    </div>
  );
};

export default MessageFeed;
