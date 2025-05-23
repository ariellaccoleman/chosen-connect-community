
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProfileOrganizationRelationshipWithDetails } from '@/types';
import { formatOrganizationRelationships } from '@/utils/organizationFormatters';
import { logger } from '@/utils/logger';

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
      
      const { data, error } = await supabase
        .from('org_relationships')
        .select(`
          *,
          organization:organizations(
            *,
            location:locations(*)
          )
        `)
        .eq('profile_id', profileId);
      
      if (error) {
        logger.error(`usePublicProfileOrganizations: Error fetching organizations for profile ${profileId}:`, error);
        return [];
      }
      
      // Format the relationships to ensure they have the correct structure with formatted_location
      const formatted = formatOrganizationRelationships(data || []);
      logger.info(`usePublicProfileOrganizations: Found ${formatted.length} organizations for profile ${profileId}`);
      
      return formatted;
    },
    enabled: !!profileId,
  });
};
