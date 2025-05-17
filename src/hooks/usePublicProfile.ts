
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '@/api/profiles';
import { ProfileWithDetails } from '@/types';
import { showErrorToast } from '@/api/core/errorHandler';

// Hook to fetch a public profile by ID
export const usePublicProfile = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ['public-profile', profileId],
    queryFn: async (): Promise<ProfileWithDetails | null> => {
      if (!profileId) return null;
      
      const response = await profileApi.getById(profileId);
      
      if (response.error) {
        showErrorToast(response.error);
        return null;
      }
      
      return response.data;
    },
    enabled: !!profileId,
  });
};
