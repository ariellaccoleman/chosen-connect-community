
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import ChatSidebar from '@/components/chat/ChatSidebar';
import MessageFeed from '@/components/chat/MessageFeed';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApplyInitialTags } from '@/utils/chat/applyInitialTags';

export default function Chat() {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  // Apply initial tags automatically
  useApplyInitialTags();
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Community Chat</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <ChatSidebar
            selectedChannelId={selectedChannelId}
            onSelectChannel={setSelectedChannelId}
          />
        </div>
        
        <div className="md:col-span-3 h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {selectedChannelId ? (
            <MessageFeed
              channelId={selectedChannelId}
              isAuthenticated={isAuthenticated}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Select a channel to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
