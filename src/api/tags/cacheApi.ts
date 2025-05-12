
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";
import { typedRpc } from "../core/typedRpc";

/**
 * Invalidate tag cache for specific entity type or all tag caches
 */
export const invalidateTagCache = async (
  entityType?: string
): Promise<ApiResponse<boolean>> => {
  return apiClient.query(async (client) => {
    if (entityType) {
      // Delete specific entityType cache
      const cacheKey = `selection_tags_${entityType}`;
      const { error } = await client
        .from('cache')
        .delete()
        .eq('key', cacheKey);
      
      if (error) throw error;
    } else {
      // Delete all tag-related cache entries
      const { error } = await client
        .from('cache')
        .delete()
        .like('key', 'selection_tags_%');
      
      if (error) throw error;
    }
    
    return createSuccessResponse(true);
  });
};
