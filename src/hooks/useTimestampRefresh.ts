
import { useCallback } from 'react';
import { forceRefreshTimestamps } from '@/utils/formatters/timeFormatters';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Hook to refresh timestamps and invalidate chat message caches
 * Useful when timestamps are displayed incorrectly due to timezone issues
 */
export const useTimestampRefresh = () => {
  const queryClient = useQueryClient();
  
  const refreshTimestamps = useCallback(() => {
    // Clear the date cache
    forceRefreshTimestamps();
    
    // Invalidate all chat-related queries to force a refresh
    queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
    queryClient.invalidateQueries({ queryKey: ['threadReplies'] });
    
    toast.success('Timestamps refreshed. Message times should now display correctly.');
  }, [queryClient]);
  
  return { refreshTimestamps };
};
