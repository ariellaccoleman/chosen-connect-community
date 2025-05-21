
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '@/api/profiles';
import { ProfileWithDetails } from '@/types';
import { logger } from '@/utils/logger';

interface CommunityProfilesParams {
  search?: string;
  limit?: number;
  excludeId?: string;
  isApproved?: boolean;
  tagId?: string | null;
}

/**
 * Hook for fetching community profiles with filtering options
 * @param params Filter parameters for community profiles
 */
export const useCommunityProfiles = (params: CommunityProfilesParams = {}) => {
  const queryKey = ['profiles', 'community', params];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Use the profileApi to get all profiles with the appropriate filters
      const response = await profileApi.getAll({
        filters: {
          ...(params.isApproved !== false && { is_approved: true }),
          ...(params.excludeId && { id: { neq: params.excludeId } })
        },
        search: params.search,
        limit: params.limit,
        include: 'tags' // Explicitly request tags to be included
      });
      
      if (response.error) {
        throw response.error;
      }
      
      logger.debug(`Fetched ${response.data?.length || 0} community profiles`);
      
      // Log some sample tag data if available
      if (response.data && response.data.length > 0 && response.data[0].tags) {
        logger.debug(`Sample profile tags structure:`, response.data[0].tags);
      }
      
      // If tag filter is applied and we have tag assignments, filter the profiles client-side
      let filteredData = response.data || [];
      
      if (params.tagId && filteredData.length > 0) {
        // This will be handled by the useFilterByTag hook at the component level
        logger.debug('Tag filtering requested for tag:', params.tagId);
      }
      
      return filteredData;
    }
  });
};
