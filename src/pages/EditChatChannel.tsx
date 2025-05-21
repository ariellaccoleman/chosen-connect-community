
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useChatChannelById, useUpdateChatChannel, useUpdateChannelTags, useChatChannelWithDetails } from '@/hooks/chat/useChatChannels';
import ChatChannelForm from '@/components/admin/chat/ChatChannelForm';
import { ChatChannel, ChatChannelUpdate } from '@/types/chat';
import { logger } from '@/utils/logger';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function EditChatChannel() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Get detailed channel info including tags
  const { data: channelDetailResponse, isLoading: detailsLoading } = useChatChannelWithDetails(id);
  const channelDetail = channelDetailResponse;
  
  // Get basic channel info for the form
  const { data: channelResponse, isLoading: basicLoading } = useChatChannelById(id);
  
  // Mutations for updating channel and tags
  const updateMutation = useUpdateChatChannel();
  const tagsMutation = useUpdateChannelTags();
  
  // Track selected tag IDs
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  
  // Extract tag IDs from channel details when loaded
  useEffect(() => {
    if (channelDetail?.tag_assignments && Array.isArray(channelDetail.tag_assignments)) {
      const tagIds = channelDetail.tag_assignments
        .map(assignment => assignment.tag?.id)
        .filter(Boolean) as string[];
      setSelectedTagIds(tagIds);
      logger.info('Loaded initial tag IDs:', tagIds);
    }
  }, [channelDetail]);
  
  const isLoading = detailsLoading || basicLoading;
  
  const handleUpdateChannel = (formData: ChatChannelUpdate) => {
    if (!id) return;
    
    // Update channel basic info
    updateMutation.mutate({ 
      id, 
      data: formData
    }, {
      onSuccess: () => {
        // Then update tags if we have any
        if (selectedTagIds.length > 0 || (channelDetail?.tag_assignments?.length || 0) > 0) {
          tagsMutation.mutate({
            channelId: id,
            tagIds: selectedTagIds
          }, {
            onSuccess: (response) => {
              if (response.status === 'success') {
                toast.success('Channel updated successfully');
                navigate('/admin/chat/channels');
              } else {
                toast.error('Channel updated but tags failed to update');
              }
            },
            onError: () => {
              toast.error('Channel updated but tags failed to update');
              navigate('/admin/chat/channels');
            }
          });
        } else {
          toast.success('Channel updated successfully');
          navigate('/admin/chat/channels');
        }
      }
    });
  };
  
  const handleTagChange = (tagIds: string[]) => {
    setSelectedTagIds(tagIds);
    logger.info('Tags selected:', tagIds);
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
  
  // Properly extract the channel data from the API response
  const channel = channelResponse?.data;
  
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
          isSubmitting={updateMutation.isPending || tagsMutation.isPending}
          defaultValues={channel as ChatChannel}
          isEditMode={true}
          existingChannelId={id}
          onTagsChange={handleTagChange}
          initialTagIds={selectedTagIds}
        />
      </div>
    </div>
  );
}
