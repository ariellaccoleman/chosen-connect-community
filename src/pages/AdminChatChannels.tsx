
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ChatChannelList from '@/components/admin/chat/ChatChannelList';
import { useChatChannels, useDeleteChatChannel } from '@/hooks/chat/useChatChannels';

export default function AdminChatChannels() {
  const { data, isLoading } = useChatChannels();
  const deleteMutation = useDeleteChatChannel();
  const channels = data?.data || [];
  
  const handleDeleteChannel = (channelId: string) => {
    if (window.confirm('Are you sure you want to delete this channel? This action cannot be undone.')) {
      deleteMutation.mutate(channelId);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Link to="/admin" className="text-sm text-muted-foreground hover:underline">
        ← Back to Admin Dashboard
      </Link>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 font-heading">Chat Channels</h1>
          <p className="text-muted-foreground">
            Manage discussion spaces and their associated tags
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/chat/channels/create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Channel
          </Link>
        </Button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-md shadow p-6">
        <ChatChannelList 
          channels={channels} 
          isLoading={isLoading} 
          onDelete={handleDeleteChannel}
          isDeleting={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}
