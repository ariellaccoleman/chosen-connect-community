
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateChatChannel } from '@/hooks/chat/useChatChannels';
import ChatChannelForm from '@/components/admin/chat/ChatChannelForm';
import { ChatChannelCreate } from '@/types/chat';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export default function CreateChatChannel() {
  const navigate = useNavigate();
  const createMutation = useCreateChatChannel();
  
  const handleCreateChannel = (data: ChatChannelCreate) => {
    logger.info("Attempting to create channel with data:", data);
    
    createMutation.mutate(data, {
      onSuccess: (response) => {
        logger.info("Channel creation response:", response);
        if (response.status === 'success' && response.data) {
          toast.success("Channel created successfully");
          navigate(`/admin/chat/channels`);
        } else if (response.error) {
          toast.error(`Failed to create channel: ${response.error.message}`);
          logger.error("Channel creation failed:", response.error);
        }
      },
      onError: (error) => {
        toast.error("Failed to create channel: An unexpected error occurred");
        logger.error("Channel creation error:", error);
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
