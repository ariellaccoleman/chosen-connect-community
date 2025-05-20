
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Get reply counts for multiple messages in a single query
 */
export const getReplyCounts = async (messageIds: string[]): Promise<Record<string, number>> => {
  try {
    if (!messageIds.length) return {};
    
    // Use a direct COUNT query with Supabase instead of RPC
    const { data, error } = await supabase
      .from('chats')
      .select('parent_id, count:count()')
      .in('parent_id', messageIds)
      .not('parent_id', 'is', null)
      .group('parent_id');
    
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
