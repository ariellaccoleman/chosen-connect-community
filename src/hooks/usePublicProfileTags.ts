
import { useQuery } from '@tanstack/react-query';
import { TagAssignment } from '@/utils/tagUtils';

/**
 * Hook to fetch tags for a public profile
 */
export const usePublicProfileTags = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ['public-profile-tags', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      
      // Reuse the existing fetchEntityTags function from tagUtils
      const { fetchEntityTags } = await import('@/utils/tagUtils');
      return await fetchEntityTags(profileId, 'person');
    },
    enabled: !!profileId,
  });
};
