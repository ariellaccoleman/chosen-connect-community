
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProfileWithDetails, Location } from '@/types';
import { formatLocationWithDetails } from '@/utils/adminFormatters';

/**
 * Hook to fetch a public profile by ID
 */
export const usePublicProfile = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ['public-profile', profileId],
    queryFn: async (): Promise<ProfileWithDetails | null> => {
      if (!profileId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          location:locations(*)
        `)
        .eq('id', profileId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      if (!data) return null;
      
      // Format profile data
      const profileWithDetails: ProfileWithDetails = {
        ...data,
        full_name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        location: undefined
      };
      
      // Format location if available
      if (data.location_id && data.location) {
        profileWithDetails.location = formatLocationWithDetails(data.location as unknown as Location);
      }
      
      return profileWithDetails;
    },
    enabled: !!profileId,
  });
};
