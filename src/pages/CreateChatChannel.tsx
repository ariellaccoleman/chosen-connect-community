
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateChannelWithTags } from '@/hooks/chat/useChatChannels';
import ChatChannelForm from '@/components/admin/chat/ChatChannelForm';
import { ChatChannelCreate } from '@/types/chat';

export default function CreateChatChannel() {
  const navigate = useNavigate();
  const createMutation = useCreateChannelWithTags();
  
  const handleCreateChannel = (data: ChatChannelCreate, tags: string[]) => {
    createMutation.mutate(data, {
      onSuccess: (response) => {
        if (response.status === 'success' && response.data) {
          navigate(`/admin/chat/channels`);
        }
      }
    });
  };
  
  return (
    <div className="container mx-auto py-6">
      <Link to="/admin/chat/channels" className="text-sm text-muted-foreground hover:underline">
        ← Back to Chat Channels
      </Link>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 font-heading">Create Chat Channel</h1>
        <p className="text-muted-foreground">
          Set up a new discussion space for your community
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-md shadow p-6">
        <ChatChannelForm 
          onSubmit={handleCreateChannel}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </div>
  );
}
