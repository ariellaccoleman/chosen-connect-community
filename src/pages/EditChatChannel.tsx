
import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useChatChannelById, useUpdateChatChannel } from '@/hooks/chat/useChatChannels';
import ChatChannelForm from '@/components/admin/chat/ChatChannelForm';
import { ChatChannelUpdate } from '@/types/chat';
import { logger } from '@/utils/logger';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditChatChannel() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: channel, isLoading } = useChatChannelById(id);
  const updateMutation = useUpdateChatChannel();
  
  const handleUpdateChannel = (formData: ChatChannelUpdate) => {
    if (!id) return;
    
    updateMutation.mutate({ 
      id, 
      data: formData
    }, {
      onSuccess: () => {
        navigate('/admin/chat/channels');
      }
    });
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Link to="/admin/chat/channels" className="text-sm text-muted-foreground hover:underline">
          ← Back to Chat Channels
        </Link>
        
        <div className="mb-6">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-md shadow p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!channel) {
    return (
      <div className="container mx-auto py-6">
        <Link to="/admin/chat/channels" className="text-sm text-muted-foreground hover:underline">
          ← Back to Chat Channels
        </Link>
        
        <div className="py-12 text-center">
          <h1 className="text-2xl font-bold mb-2">Channel Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The channel you're looking for does not exist or you don't have permission to view it.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <Link to="/admin/chat/channels" className="text-sm text-muted-foreground hover:underline">
        ← Back to Chat Channels
      </Link>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 font-heading">Edit Chat Channel</h1>
        <p className="text-muted-foreground">
          Update channel settings and tags
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-md shadow p-6">
        <ChatChannelForm 
          onSubmit={handleUpdateChannel}
          isSubmitting={updateMutation.isPending}
          defaultValues={channel}
          isEditMode={true}
          existingChannelId={id}
        />
      </div>
    </div>
  );
}
