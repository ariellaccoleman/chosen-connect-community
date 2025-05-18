
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  isSubmitting?: boolean;
  initialValue?: string;
  autoFocus?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  placeholder = 'Type your message...',
  isSubmitting = false,
  initialValue = '',
  autoFocus = false
}) => {
  const [message, setMessage] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !isSubmitting) {
      onSendMessage(message);
      setMessage('');
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
          disabled={isSubmitting}
          rows={1}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!message.trim() || isSubmitting}
          className="absolute bottom-2 right-2 p-1 h-auto w-auto"
          variant="ghost"
        >
          {isSubmitting ? (
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
