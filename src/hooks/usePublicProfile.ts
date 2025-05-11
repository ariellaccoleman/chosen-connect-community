
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProfileWithDetails } from '@/types';

// Format profile with details (same as the helper in useProfileQueries.ts)
const formatProfileData = (data: any): ProfileWithDetails | null => {
  if (!data) return null;
  
  const profile = data as ProfileWithDetails;
  
  // Format full name
  profile.full_name = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(' ');
  
  // Format location if available
  if (profile.location) {
    profile.location.formatted_location = [
      profile.location.city, 
      profile.location.region, 
      profile.location.country
    ]
      .filter(Boolean)
      .join(', ');
  }
  
  return profile;
};

// Hook to fetch a public profile by ID
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
        console.error('Error fetching public profile:', error);
        throw error;
      }
      
      return formatProfileData(data);
    },
    enabled: !!profileId,
  });
};
