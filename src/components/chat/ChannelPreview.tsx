
import React from 'react';
import { ChatChannel } from '@/types/chat';
import { useChannelMessagePreviews } from '@/hooks/chat/useChannelMessagePreviews';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '@/utils/formatters/timeFormatters';

interface ChannelPreviewProps {
  channel: ChatChannel;
  maxMessages?: number;
}

/**
 * Component to display a preview of recent messages in a chat channel
 */
const ChannelPreview: React.FC<ChannelPreviewProps> = ({ channel, maxMessages = 3 }) => {
  const { data: messages = [], isLoading } = useChannelMessagePreviews(channel.id, maxMessages);
  
  if (isLoading) {
    return (
      <div className="space-y-2 mt-3">
        {Array(2).fill(0).map((_, i) => (
          <div key={i} className="flex gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="mt-3 space-y-4">
      {messages.length > 0 ? (
        <div className="space-y-2">
          {messages.map(message => (
            <div key={message.id} className="text-sm">
              <div className="flex items-start gap-2">
                <span className="font-semibold truncate max-w-[30%]">
                  {message.author?.full_name || 'Anonymous'}:
                </span>
                <span className="text-muted-foreground line-clamp-1 flex-1">
                  {message.message}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          No messages yet. Be the first to start a conversation!
        </div>
      )}
      
      <Button 
        size="sm" 
        className="w-full mt-2" 
        variant="outline" 
        asChild
      >
        <Link to={`/chat/${channel.id}`} className="flex items-center justify-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Join the Conversation
        </Link>
      </Button>
    </div>
  );
};

export default ChannelPreview;
