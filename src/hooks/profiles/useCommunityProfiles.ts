
import { useQuery } from '@tanstack/react-query';
import { ProfileWithDetails } from '@/types';
import { logger } from '@/utils/logger';
import { profileApi } from '@/api/profiles';

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
        // We need to get tag data for each profile
        // The query parameter adds tag assignments and tag details to each profile
        query: `*, tags:tag_assignments(*, tag:tags(*))`
      });
      
      if (response.error) {
        throw response.error;
      }
      
      logger.debug(`Fetched ${response.data?.length || 0} community profiles`);
      
      // Enhanced debugging: check for specific profile
      const targetProfileId = "95ad82bb-4109-4f88-8155-02231dda3b85";
      const targetProfile = response.data?.find(p => p.id === targetProfileId);
      
      if (targetProfile) {
        logger.debug(`Target profile found in API response:`, {
          id: targetProfile.id,
          name: `${targetProfile.first_name} ${targetProfile.last_name}`,
          email: targetProfile.email
        });
        
        // Log tag assignments for this profile
        logger.debug(`Target profile tags:`, targetProfile.tags);
      } else {
        logger.debug(`Target profile not found in API response`);
      }

      // Check tag assignments via direct query for verification
      if (response.data && response.data.length > 0) {
        try {
          const tagAssignmentsResponse = await profileApi.getAll({
            query: `
              id,
              tag_assignments!inner(
                tag_id,
                tag:tags(name)
              )
            `,
            filters: {
              id: targetProfileId
            }
          });
          
          if (tagAssignmentsResponse.error) {
            logger.error('Error fetching tag assignments for target profile:', tagAssignmentsResponse.error);
          } else {
            logger.debug(`Tag assignments for target profile (direct query):`, tagAssignmentsResponse.data);
          }
        } catch (e) {
          logger.error('Exception while fetching tag assignments:', e);
        }
      }
      
      // Log some sample tag data if available
      if (response.data && response.data.length > 0 && response.data[0].tags) {
        logger.debug(`Sample profile tags structure:`, 
          response.data.slice(0, 2).map(p => ({
            id: p.id, 
            name: `${p.first_name} ${p.last_name}`,
            tags: p.tags?.map(t => ({ id: t.id, name: t.name }))
          }))
        );
        
        // Check profiles with the specific tag we're interested in
        const targetTagId = "2de8fd5d-3311-4e38-94a3-596ee596524b";
        const profilesWithTargetTag = response.data.filter(profile => 
          profile.tags && profile.tags.some(t => t.id === targetTagId)
        );
        
        logger.debug(`Profiles with target tag ${targetTagId}: ${profilesWithTargetTag.length}`, 
          profilesWithTargetTag.map(p => ({ 
            id: p.id, 
            name: `${p.first_name} ${p.last_name}` 
          }))
        );
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
