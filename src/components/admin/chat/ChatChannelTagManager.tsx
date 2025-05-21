
import React, { useState } from 'react';
import { useChatChannelTags, useAddChatChannelTag, useRemoveChatChannelTag } from '@/hooks/chat/useChatChannelTags';
import TagList from '@/components/tags/TagList';
import { Skeleton } from '@/components/ui/skeleton';
import TagSelector from '@/components/tags/TagSelector';
import { EntityType } from '@/types/entityTypes';
import { Button } from '@/components/ui/button';
import { Edit, X } from 'lucide-react';
import { Tag } from '@/utils/tags/types';

interface ChatChannelTagManagerProps {
  channelId: string;
  isAdmin?: boolean;
}

export default function ChatChannelTagManager({ channelId, isAdmin = true }: ChatChannelTagManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { data: tagAssignments, isLoading } = useChatChannelTags(channelId);
  const addTagMutation = useAddChatChannelTag();
  const removeTagMutation = useRemoveChatChannelTag();
  
  const handleAddTag = (tag: Tag) => {
    if (!tag || !tag.id) return;
    
    addTagMutation.mutate({
      channelId,
      tagId: tag.id
    });
  };
  
  const handleRemoveTag = (assignmentId: string) => {
    removeTagMutation.mutate({
      assignmentId,
      channelId
    });
  };
  
  if (isLoading) {
    return <Skeleton className="h-12 w-full" />;
  }
  
  if (!isAdmin && (!tagAssignments || tagAssignments.length === 0)) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Tags</h3>
        {isAdmin && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Done
              </>
            ) : (
              <>
                <Edit className="mr-2 h-4 w-4" />
                Edit Tags
              </>
            )}
          </Button>
        )}
      </div>
      
      {isEditing ? (
        <div>
          <div className="mb-4">
            <TagSelector
              targetType={EntityType.CHAT}
              onTagSelected={handleAddTag}
              isAdmin={isAdmin}
            />
          </div>
          
          <TagList 
            tagAssignments={tagAssignments || []} 
            onRemove={isAdmin ? handleRemoveTag : undefined}
            currentEntityType={EntityType.CHAT}
            isRemoving={removeTagMutation.isPending}
          />
        </div>
      ) : (
        <TagList 
          tagAssignments={tagAssignments || []} 
          currentEntityType={EntityType.CHAT}
        />
      )}
    </div>
  );
}
