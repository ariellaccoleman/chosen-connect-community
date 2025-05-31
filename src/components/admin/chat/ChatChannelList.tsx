
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Edit, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatChannel } from '@/types/chat';
import { format } from 'date-fns';
import TagList from '@/components/tags/TagList';
import { useEntityTags } from '@/hooks/tags/useTagFactoryHooks';
import { EntityType } from '@/types/entityTypes';

interface ChatChannelListProps {
  channels: ChatChannel[];
  isLoading: boolean;
  onDelete?: (channelId: string) => void;
  isDeleting?: boolean;
}

export default function ChatChannelList({ 
  channels, 
  isLoading,
  onDelete,
  isDeleting = false
}: ChatChannelListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-md p-4">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    );
  }
  
  if (channels.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md">
        <p className="text-muted-foreground">No chat channels found.</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Access</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {channels.map(channel => (
            <ChatChannelRow 
              key={channel.id} 
              channel={channel}
              onDelete={onDelete}
              isDeleting={isDeleting}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface ChatChannelRowProps {
  channel: ChatChannel;
  onDelete?: (channelId: string) => void;
  isDeleting?: boolean;
}

function ChatChannelRow({ channel, onDelete, isDeleting }: ChatChannelRowProps) {
  const { data: tagAssignments } = useEntityTags(channel.id, EntityType.CHAT);
  
  // Convert TagAssignment[] to Tag[] for display
  const simpleTags = tagAssignments
    ?.filter(assignment => assignment.tag)
    .map(assignment => assignment.tag!)
    .filter(Boolean) || [];
  
  return (
    <TableRow key={channel.id}>
      <TableCell className="font-medium">{channel.name || 'Unnamed channel'}</TableCell>
      <TableCell className="max-w-xs truncate">{channel.description || '-'}</TableCell>
      <TableCell>
        <span className="capitalize">{channel.channel_type}</span>
      </TableCell>
      <TableCell>
        {channel.is_public ? (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-green-900/30 dark:text-green-300">
            Public
          </span>
        ) : (
          <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-amber-900/30 dark:text-amber-300">
            Private
          </span>
        )}
      </TableCell>
      <TableCell>
        <TagList 
          tags={simpleTags}
          className="flex flex-wrap"
        />
      </TableCell>
      <TableCell>
        {format(new Date(channel.created_at), 'MMM d, yyyy')}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/admin/chat/channels/${channel.id}/edit`}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Link>
          </Button>
          {onDelete && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => onDelete(channel.id)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
