
import { useQuery } from '@tanstack/react-query';
import { ProfileOrganizationRelationshipWithDetails } from '@/types';
import { formatOrganizationRelationships } from '@/utils/organizationFormatters';
import { logger } from '@/utils/logger';
import { createOrganizationRelationshipApi } from '@/api/organizations/relationshipApiFactory';

// Hook to fetch organization relationships for a public profile
export const usePublicProfileOrganizations = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ['profile-organizations', profileId],
    queryFn: async (): Promise<ProfileOrganizationRelationshipWithDetails[]> => {
      if (!profileId) {
        logger.warn('usePublicProfileOrganizations: No profileId provided');
        return [];
      }
      
      logger.info(`usePublicProfileOrganizations: Fetching organizations for profile ${profileId}`);
      
      // Create organization relationship API instance
      const orgRelationshipApi = createOrganizationRelationshipApi();
      
      // Use the API factory to get relationships for the profile
      const response = await orgRelationshipApi.getForProfile(profileId);
      
      if (response.error) {
        logger.error(`usePublicProfileOrganizations: Error fetching organizations for profile ${profileId}:`, response.error);
        return [];
      }
      
      // Format the relationships to ensure they have the correct structure with formatted_location
      const formatted = formatOrganizationRelationships(response.data || []);
      logger.info(`usePublicProfileOrganizations: Found ${formatted.length} organizations for profile ${profileId}`);
      
      return formatted;
    },
    enabled: !!profileId,
  });
};
