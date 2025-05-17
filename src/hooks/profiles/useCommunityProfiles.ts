
import { useQuery } from '@tanstack/react-query';
import { profilesApi } from '@/api/profiles';
import { ProfileWithDetails } from '@/types';

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
      const response = await profilesApi.getCommunityProfiles(params);
      
      if (response.error) {
        throw response.error;
      }
      
      return response.data;
    }
  });
};
