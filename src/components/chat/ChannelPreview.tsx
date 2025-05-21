import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useChannelMessagePreviews } from '@/hooks/chat';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_ROUTES } from '@/config/routes';
import { MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChannelPreviewProps {
  limit?: number;
  channelTagId?: string;
}

interface ChannelPreviewData {
  id: string;
  name?: string;
  unread_count?: number;
  last_message?: {
    user_name?: string;
    message?: string;
  };
  last_active_time?: string;
}

const ChannelPreview = ({ limit = 3, channelTagId }: ChannelPreviewProps) => {
  // Convert limit to number if it's a string
  const limitNum = typeof limit === 'string' ? parseInt(limit) : limit;
  
  // Use the hook with the proper limit type
  const { data: channels = [], isLoading } = useChannelMessagePreviews(limitNum.toString(), channelTagId);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Recent Conversations</span>
            <Skeleton className="h-5 w-20" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (channels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Recent Conversations</span>
            <Link 
              to={APP_ROUTES.CHAT} 
              className="text-sm font-normal text-primary hover:underline"
            >
              View all
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No conversations available</p>
          <p className="mt-2">
            <Link to={APP_ROUTES.CHAT} className="text-primary hover:underline">
              Start a conversation
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>Recent Conversations</span>
          <Link 
            to={APP_ROUTES.CHAT} 
            className="text-sm font-normal text-primary hover:underline"
          >
            View all
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {channels.map((channel: ChannelPreviewData) => {
            const lastMessageTime = channel.last_active_time || channel.last_message?.message;
            const formattedTime = lastMessageTime 
              ? formatDistanceToNow(new Date(lastMessageTime), { addSuffix: true }) 
              : '';
            
            return (
              <Link 
                key={channel.id} 
                to={`${APP_ROUTES.CHAT}/${channel.id}`}
                className="block"
              >
                <div className="p-3 border rounded-md hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{channel.name || 'Unnamed channel'}</h3>
                    {channel.unread_count && channel.unread_count > 0 && (
                      <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                        {channel.unread_count}
                      </span>
                    )}
                  </div>
                  
                  {channel.last_message && (
                    <>
                      <div className="text-sm text-muted-foreground mt-1 flex items-start gap-1">
                        <MessageCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <div className="flex-1 truncate">
                          <span className="font-medium mr-1">
                            {channel.last_message.user_name || 'Unknown'}:
                          </span>
                          {channel.last_message.message || 'New message'}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formattedTime}
                      </div>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChannelPreview;
