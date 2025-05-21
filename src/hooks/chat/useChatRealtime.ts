import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { ChatMessageWithAuthor } from '@/types/chat';
import { ChatMessageFactory } from '@/utils/chat/ChatMessageFactory';
import { RealtimePostgresChangesPayload, RealtimePostgresInsertPayload } from '@supabase/supabase-js';

/**
 * Helper function to validate if a string is a valid UUID
 */
const isValidUUID = (id: string | null | undefined): boolean => {
  if (!id || id === 'null' || id === 'undefined') return false;
  
  // Basic UUID validation regex
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

interface RealtimeOptions {
  onNewMessage?: (message: ChatMessageWithAuthor) => void;
  notifyUser?: boolean;
}

/**
 * Base hook for setting up real-time subscriptions
 */
const useRealtimeSubscription = (
  subscriptionType: 'channel' | 'thread',
  entityId: string | null | undefined,
  options: RealtimeOptions = {}
) => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const { onNewMessage, notifyUser = true } = options;

  useEffect(() => {
    // Validate parameters
    if (!isValidUUID(entityId)) {
      logger.info(`No valid ${subscriptionType} ID provided: "${entityId}"`);
      return;
    }
    
    if (!isAuthenticated || !user) {
      logger.warn(`User is not authenticated for ${subscriptionType} real-time updates`);
      return;
    }
    
    logger.info(`[REAL-TIME] Setting up subscription for ${subscriptionType}: ${entityId}`);
    
    // Set up the appropriate filter based on subscription type
    const filter = subscriptionType === 'channel' 
      ? { 
          event: 'INSERT' as const, 
          schema: 'public' as const, 
          table: 'chats' as const, 
          filter: `channel_id=eq.${entityId}` 
        }
      : { 
          event: 'INSERT' as const, 
          schema: 'public' as const, 
          table: 'chats' as const, 
          filter: `parent_id=eq.${entityId}` 
        };
      
    // Create appropriate query key
    const queryKey = subscriptionType === 'channel' 
      ? ['chatMessages', entityId]
      : ['threadMessages', entityId];
    
    // Fixed Supabase channel subscription format
    const channelName = `${subscriptionType}-${entityId}`;
    const channel = supabase.channel(channelName);
    
    // Subscribe to changes with correct Supabase v2 syntax
    const subscription = channel.on(
      'postgres_changes' as const,
      filter,
      (payload: RealtimePostgresInsertPayload<ChatMessageWithAuthor>) => {
        logger.info(`[REAL-TIME] New ${subscriptionType} message received`);
        
        // Process the message
        const processedMessage = ChatMessageFactory.processRealtimeMessage(payload);
        logger.info(`[REAL-TIME] Processed message: ${processedMessage.id}`);
        
        // Handle thread-specific updates
        if (subscriptionType === 'channel' && processedMessage.parent_id) {
          // Update reply count for parent message
          updateParentMessageReplyCount(queryClient, processedMessage);
        }
        
        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({ queryKey, refetchType: 'all' });
        
        // Execute callback if provided
        if (onNewMessage) {
          onNewMessage(processedMessage);
        }
        
        // Show notification if not from current user
        if (notifyUser && processedMessage.user_id !== user.id) {
          toast.info(subscriptionType === 'channel' 
            ? 'New message received' 
            : 'New reply in thread');
        }
      }
    )
    .subscribe((status) => {
      logger.info(`[REAL-TIME] ${subscriptionType} subscription status: ${status}`);
      if (status === 'CHANNEL_ERROR') {
        logger.error(`[REAL-TIME] Error subscribing to ${subscriptionType} updates`);
        toast.error('Error connecting to updates. Please refresh the page.');
      }
    });
      
    // Cleanup on unmount
    return () => {
      logger.info(`[REAL-TIME] Cleaning up subscription for ${subscriptionType}: ${entityId}`);
      supabase.removeChannel(channel);
    };
  }, [entityId, queryClient, isAuthenticated, user, onNewMessage, notifyUser]);
};

/**
 * Helper to update reply count for parent message
 */
const updateParentMessageReplyCount = (
  queryClient: ReturnType<typeof useQueryClient>,
  message: ChatMessageWithAuthor
) => {
  if (!message.parent_id || !message.channel_id) return;
  
  const parentId = message.parent_id;
  const messagesKey = ['chatMessages', message.channel_id];
  
  // Update the reply_count for the parent message in all matching queries
  queryClient.setQueriesData(
    { queryKey: messagesKey, exact: false },
    (oldData: any) => {
      if (!oldData || !Array.isArray(oldData)) return oldData;
      
      return oldData.map((msg: ChatMessageWithAuthor) => {
        if (msg.id === parentId) {
          const currentCount = msg.reply_count || 0;
          return { ...msg, reply_count: currentCount + 1 };
        }
        return msg;
      });
    }
  );
};

/**
 * Hook to subscribe to real-time channel messages
 */
export const useChannelMessagesRealtime = (
  channelId: string | null | undefined,
  options: RealtimeOptions = {}
) => {
  return useRealtimeSubscription('channel', channelId, options);
};

/**
 * Hook to subscribe to real-time thread replies
 */
export const useThreadRepliesRealtime = (
  parentId: string | null | undefined,
  options: RealtimeOptions = {}
) => {
  return useRealtimeSubscription('thread', parentId, options);
};
