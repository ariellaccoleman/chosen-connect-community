import { useQuery } from '@tanstack/react-query';
import { profilesApi } from '@/api/profilesApi';
import { ProfileWithDetails } from '@/types';

interface CommunityProfilesParams {
  search?: string;
  limit?: number;
  excludeId?: string;
  isApproved?: boolean;
  tagId?: string | null;
}

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
