
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useSendMessage } from '@/hooks/chat';
import { logger } from '@/utils/logger';

interface MessageInputProps {
  channelId: string;
  userId: string;
  parentId?: string;
  placeholder?: string;
  onMessageSent?: () => void;
  autoFocus?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  channelId,
  userId,
  parentId,
  placeholder = 'Type your message...',
  onMessageSent,
  autoFocus = false
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendMessageMutation = useSendMessage();

  // Auto resize the textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  // Apply autofocus if specified
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !sendMessageMutation.isPending) {
      logger.info(`Sending message to channel ${channelId}: ${message.substring(0, 20)}${message.length > 20 ? '...' : ''}`);
      
      try {
        await sendMessageMutation.mutateAsync({ 
          channelId, 
          message: message.trim(), 
          parentId 
        });
        
        setMessage('');
        
        if (onMessageSent) {
          onMessageSent();
        }
      } catch (error) {
        logger.error('Failed to send message:', error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter without shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pr-10 resize-none max-h-[200px] min-h-[40px]"
          disabled={sendMessageMutation.isPending}
          rows={1}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!message.trim() || sendMessageMutation.isPending}
          className="absolute bottom-2 right-2 p-1 h-auto w-auto"
          variant="ghost"
        >
          {sendMessageMutation.isPending ? (
            <Loader size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </form>
  );
};

export default MessageInput;
