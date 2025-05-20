
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { ChatMessageWithAuthor } from '@/types/chat';
import { processChatMessage } from '@/utils/chat/messageUtils';

/**
 * Helper function to validate if a string is a valid UUID
 */
const isValidUUID = (id: string | null | undefined): boolean => {
  if (!id || id === 'null' || id === 'undefined') return false;
  
  // Basic UUID validation regex
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Hook to subscribe to real-time channel messages
 */
export const useChannelMessagesRealtime = (channelId: string | null | undefined) => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Enhanced validation for channelId
    if (!isValidUUID(channelId)) {
      logger.info(`No valid channelId provided to useChannelMessagesRealtime: "${channelId}"`);
      return; 
    }
    
    // Validate authentication
    if (!isAuthenticated || !user) {
      logger.warn('User is not authenticated for real-time updates');
      return; 
    }
    
    logger.info(`[CODE PATH] REAL-TIME: Setting up subscription for channel: ${channelId} (user: ${user.id})`);
    
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
          logger.info('[CODE PATH] REAL-TIME: New channel message received:');
          logger.info(`[REAL-TIME] Payload for message: ${JSON.stringify(payload.new?.id)}`);
          
          // Log timestamp for debugging
          if (payload.new && payload.new.created_at) {
            logger.info(`[REAL-TIME] Raw timestamp: ${payload.new.created_at}`);
            logger.info(`[REAL-TIME] User timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
          }
          
          // Process the new message with our utility for consistent timestamp handling
          logger.info('[REAL-TIME] Processing message with processChatMessage');
          const processedMessage = processChatMessage(payload.new, false); // false because we don't have author info yet
          
          // Log the processed message
          logger.info(`[REAL-TIME] Processed message: ${processedMessage.id}`);
          logger.info(`[REAL-TIME] Processed timestamp: ${processedMessage.created_at}`);
          logger.info(`[REAL-TIME] Formatted timestamp: ${processedMessage.formatted_time}`);
          
          // Check if this is a reply to a thread
          if (processedMessage.parent_id) {
            // If it's a reply, we need to update the reply count for the parent message
            const parentId = processedMessage.parent_id;
            logger.info(`Updating reply count for parent message: ${parentId}`);
            
            // Get all message queries for this channel
            const messagesKey = ['chatMessages', channelId];
            
            // Update the reply_count for the parent message in all matching queries
            queryClient.setQueriesData(
              { queryKey: messagesKey, exact: false },
              (oldData: any) => {
                // If no data or not an array, return as is
                if (!oldData || !Array.isArray(oldData)) return oldData;
                
                // Find and update the parent message's reply count
                return oldData.map((message: ChatMessageWithAuthor) => {
                  if (message.id === parentId) {
                    const currentCount = message.reply_count || 0;
                    return { ...message, reply_count: currentCount + 1 };
                  }
                  return message;
                });
              }
            );
          }
          
          // Immediately invalidate and refetch the channel messages query
          logger.info('[REAL-TIME] Invalidating and refetching channel messages');
          queryClient.invalidateQueries({ 
            queryKey: ['chatMessages', channelId],
            refetchType: 'all' // Force refetch instead of just invalidating
          });
          
          // Show toast notification for new messages not from current user
          if (processedMessage.user_id !== user.id) {
            toast.info('New message received');
          }
        }
      )
      .subscribe((status) => {
        logger.info(`[REAL-TIME] Channel subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          logger.info('[REAL-TIME] Successfully subscribed to real-time updates for channel');
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('[REAL-TIME] Error subscribing to real-time updates for channel', channelId);
          toast.error('Error connecting to chat. Please refresh the page.');
        }
      });
      
    // Cleanup on unmount
    return () => {
      logger.info(`[REAL-TIME] Cleaning up subscription for channel: ${channelId}`);
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
    // Enhanced validation for parentId
    if (!isValidUUID(parentId)) {
      logger.info(`No valid parentId provided to useThreadRepliesRealtime: "${parentId}"`);
      return;
    }
    
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
          
          // Log the timestamp for debugging
          if (payload.new && payload.new.created_at) {
            logger.info(`Real-time thread reply timestamp: ${payload.new.created_at}`);
          }
          
          // Process the message with our utility for consistent handling
          const processedMessage = processChatMessage(payload.new, false); // false because we don't have author info yet
          
          // Invalidate and refetch the thread messages query
          queryClient.invalidateQueries({ 
            queryKey: ['threadMessages', parentId],
            refetchType: 'all'
          });
          
          // Update the reply count for the parent message in channel messages queries
          const channelId = processedMessage.channel_id;
          if (channelId) {
            // Get all message queries that might contain this channel's messages
            const messagesKey = ['chatMessages', channelId];
            
            // Update the reply_count for the parent message
            queryClient.setQueriesData(
              { queryKey: messagesKey, exact: false },
              (oldData: any) => {
                // If no data, return as is
                if (!oldData || !Array.isArray(oldData)) return oldData;
                
                // Find and update the parent message
                return oldData.map((message: ChatMessageWithAuthor) => {
                  if (message.id === parentId) {
                    const currentCount = message.reply_count || 0;
                    return { ...message, reply_count: currentCount + 1 };
                  }
                  return message;
                });
              }
            );
          }
          
          // Notify if message is from someone else
          if (processedMessage.user_id !== user.id) {
            toast.info('New reply in thread');
          }
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
