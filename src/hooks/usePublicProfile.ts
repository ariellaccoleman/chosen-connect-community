
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '@/api/profiles';
import { ProfileWithDetails } from '@/types';
import { showErrorToast } from '@/api/core/errorHandler';
import { logger } from '@/utils/logger';

// Hook to fetch a public profile by ID
export const usePublicProfile = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ['public-profile', profileId],
    queryFn: async (): Promise<ProfileWithDetails | null> => {
      if (!profileId) {
        logger.warn('usePublicProfile: No profileId provided');
        return null;
      }
      
      logger.info(`usePublicProfile: Fetching profile with ID ${profileId}`);
      const response = await profileApi.getById(profileId);
      
      if (response.error) {
        logger.error(`usePublicProfile: Error fetching profile ${profileId}:`, response.error);
        showErrorToast(response.error);
        return null;
      }
      
      logger.info(`usePublicProfile: Successfully fetched profile ${profileId}`);
      return response.data;
    },
    enabled: !!profileId,
  });
};
