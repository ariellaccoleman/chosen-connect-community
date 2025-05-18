
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { ChatMessage, ChatMessageWithAuthor } from '@/types/chat';

/**
 * Hook to subscribe to real-time channel messages
 */
export const useChannelMessagesRealtime = (channelId: string | null | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!channelId) return;
    
    logger.info(`Setting up real-time subscription for channel: ${channelId}`);
    
    // Subscribe to new messages in the channel that don't have a parent (main channel messages)
    const channel = supabase
      .channel(`channel-${channelId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chats',
          filter: `channel_id=eq.${channelId} AND parent_id=is.null` 
        },
        (payload) => {
          logger.info('New channel message received:', payload);
          
          // Invalidate the channel messages query to trigger a refetch
          queryClient.invalidateQueries({ 
            queryKey: ['chatMessages', channelId] 
          });
        }
      )
      .subscribe();
      
    // Cleanup on unmount
    return () => {
      logger.info(`Cleaning up real-time subscription for channel: ${channelId}`);
      supabase.removeChannel(channel);
    };
  }, [channelId, queryClient]);
};

/**
 * Hook to subscribe to real-time thread replies
 */
export const useThreadRepliesRealtime = (parentId: string | null | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!parentId) return;
    
    logger.info(`Setting up real-time subscription for thread: ${parentId}`);
    
    // Subscribe to new replies to the thread
    const channel = supabase
      .channel(`thread-${parentId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chats',
          filter: `parent_id=eq.${parentId}` 
        },
        (payload) => {
          logger.info('New thread reply received:', payload);
          
          // Invalidate the thread messages query to trigger a refetch
          queryClient.invalidateQueries({ 
            queryKey: ['threadMessages', parentId] 
          });
          
          // Also update reply count for the parent message in all channel queries
          queryClient.invalidateQueries({
            queryKey: ['chatMessages'],
            refetchType: 'none' // Don't actually refetch, just invalidate
          });
        }
      )
      .subscribe();
      
    // Cleanup on unmount
    return () => {
      logger.info(`Cleaning up real-time subscription for thread: ${parentId}`);
      supabase.removeChannel(channel);
    };
  }, [parentId, queryClient]);
};
