
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Create a view for reply counts
 * 
 * This function creates or replaces a materialized view in Supabase
 * to efficiently count replies for each parent message.
 * This is used by the getReplyCountsForMessages function.
 */
export const createReplyCountView = async (): Promise<boolean> => {
  try {
    // Create a SQL view for efficient reply counting
    const { error } = await supabase.rpc('create_reply_count_view');
    
    if (error) {
      logger.error('Error creating reply count view:', error);
      return false;
    }
    
    logger.info('Reply count view created or updated successfully');
    return true;
  } catch (error) {
    logger.error('Exception creating reply count view:', error);
    return false;
  }
};

/**
 * Alternative implementation using a direct query approach
 * This can be used as a fallback if the view-based approach has issues
 */
export const getReplyCounts = async (messageIds: string[]): Promise<Record<string, number>> => {
  try {
    if (!messageIds.length) return {};
    
    // Use a direct count query with Supabase
    const { data, error } = await supabase.rpc('get_reply_counts', { 
      message_ids: messageIds 
    });
    
    if (error) {
      logger.error('Error getting reply counts:', error);
      return {};
    }
    
    // Transform the result to a map
    const countMap: Record<string, number> = {};
    if (data && Array.isArray(data)) {
      data.forEach((item: any) => {
        if (item.parent_id && item.count) {
          countMap[item.parent_id] = parseInt(item.count, 10);
        }
      });
    }
    
    return countMap;
  } catch (error) {
    logger.error('Error in getReplyCounts:', error);
    return {};
  }
};
