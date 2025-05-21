
import React from 'react';
import { ChatChannel } from '@/types/chat';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import ChannelPreview from '@/components/chat/ChannelPreview';

interface ChatChannelCarouselProps {
  channels: ChatChannel[];
  isLoading: boolean;
}

/**
 * Carousel component for displaying chat channels in the hub detail page
 */
const ChatChannelCarousel: React.FC<ChatChannelCarouselProps> = ({ channels, isLoading }) => {
  if (isLoading || channels.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <MessageSquare className="h-5 w-5 mr-2" />
        <span>Chat Channels</span>
      </h2>
      
      <Carousel className="w-full">
        <CarouselContent className="-ml-4 overflow-visible">
          {channels.map(channel => (
            <CarouselItem key={`channel-${channel.id}`} className="pl-4 md:basis-2/5 lg:basis-2/7 pr-4">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <CardTitle className="flex items-center mb-2 text-xl">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    {channel.name || "Unnamed Channel"}
                  </CardTitle>
                  {channel.description && (
                    <p className="text-muted-foreground mt-2 line-clamp-2">{channel.description}</p>
                  )}
                  
                  <ChannelPreview channel={channel} />
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        {channels.length > 1 && (
          <div className="flex justify-end mt-2">
            <CarouselPrevious className="mr-2 static translate-y-0 left-auto" />
            <CarouselNext className="static translate-y-0 right-auto" />
          </div>
        )}
      </Carousel>
    </div>
  );
};

export default ChatChannelCarousel;
