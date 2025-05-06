
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProfileWithDetails, Location } from '@/types';

// Helper function to format profile data
const formatProfileData = (data: any): ProfileWithDetails | null => {
  if (!data) return null;
  
  const profile = data as ProfileWithDetails;
  
  // Format full name
  profile.full_name = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(' ');
  
  // Format location if available
  if (profile.location) {
    const location = profile.location as Location;
    profile.location.formatted_location = [location.city, location.region, location.country]
      .filter(Boolean)
      .join(', ');
  }
  
  return profile;
};

export const useCurrentProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<ProfileWithDetails | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          location:locations(*)
        `)
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return formatProfileData(data);
    },
    enabled: !!userId,
  });
};

export const useProfiles = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['profiles', userId],
    queryFn: async (): Promise<ProfileWithDetails | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          location:locations(*)
        `)
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return formatProfileData(data);
    },
    enabled: !!userId,
  });
};
