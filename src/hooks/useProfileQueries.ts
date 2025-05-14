
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProfileWithDetails, Location } from '@/types';
import { User } from '@supabase/supabase-js';

// Helper function to format profile data
const formatProfileData = (data: any, authUser?: User | null): ProfileWithDetails | null => {
  if (!data) return null;
  
  const profile = data as ProfileWithDetails;
  
  // Format full name
  profile.full_name = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(' ');
  
  // Format location if available
  if (profile.location) {
    const location = profile.location as Location;
    if (!profile.location.formatted_location) {
      profile.location.formatted_location = [location.city, location.region, location.country]
        .filter(Boolean)
        .join(', ');
    }
  }
  
  // Add role from auth user metadata if available
  if (authUser && authUser.user_metadata?.role) {
    profile.role = authUser.user_metadata.role;
  }
  
  return profile;
};

// Main hook for getting the current user's profile
export const useCurrentProfile = (userId: string | undefined, authUser?: User | null) => {
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
      
      return formatProfileData(data, authUser);
    },
    enabled: !!userId,
  });
};

// For consistency with how the hook was previously used
export const useProfileQueries = useCurrentProfile;
