
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook to subscribe to real-time channel messages
 */
export const useChannelMessagesRealtime = (channelId: string | null | undefined) => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!channelId || channelId === 'null' || channelId === 'undefined') {
      logger.warn('No valid channelId provided to useChannelMessagesRealtime');
      return;
    }

    if (!isAuthenticated || !user) {
      logger.warn('User is not authenticated for real-time updates');
      return; // Don't set up subscription if not authenticated
    }
    
    logger.info(`Setting up real-time subscription for channel: ${channelId} (user: ${user.id})`);
    
    // Subscribe to new messages in the channel
    const channel = supabase
      .channel(`channel-${channelId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chats',
          filter: `channel_id=eq.${channelId}` 
        },
        (payload) => {
          logger.info('Real-time: New channel message received:', payload);
          
          // Invalidate the channel messages query to trigger a refetch
          queryClient.invalidateQueries({ 
            queryKey: ['chatMessages', channelId] 
          });
        }
      )
      .subscribe((status) => {
        logger.info(`Real-time channel subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          logger.info('Successfully subscribed to real-time updates for channel');
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Error subscribing to real-time updates for channel');
          toast.error('Error connecting to chat. Please refresh the page.');
        }
      });
      
    // Cleanup on unmount
    return () => {
      logger.info(`Cleaning up real-time subscription for channel: ${channelId}`);
      supabase.removeChannel(channel);
    };
  }, [channelId, queryClient, isAuthenticated, user]);
};

/**
 * Hook to subscribe to real-time thread replies
 */
export const useThreadRepliesRealtime = (parentId: string | null | undefined) => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!parentId || parentId === 'null' || parentId === 'undefined') return;
    
    if (!isAuthenticated || !user) {
      logger.warn('User is not authenticated for real-time thread updates');
      return;
    }
    
    logger.info(`Setting up real-time subscription for thread: ${parentId} (user: ${user.id})`);
    
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
          logger.info('Real-time: New thread reply received:', payload);
          
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
      .subscribe((status) => {
        logger.info(`Real-time thread subscription status: ${status}`);
        if (status === 'CHANNEL_ERROR') {
          logger.error('Error subscribing to real-time thread updates');
          toast.error('Error connecting to thread updates');
        }
      });
      
    // Cleanup on unmount
    return () => {
      logger.info(`Cleaning up real-time subscription for thread: ${parentId}`);
      supabase.removeChannel(channel);
    };
  }, [parentId, queryClient, isAuthenticated, user]);
};
