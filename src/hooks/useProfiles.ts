
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile, ProfileWithDetails, Location } from '@/types';
import { toast } from '@/components/ui/sonner';

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
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
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
        .maybeSingle(); // Use maybeSingle() instead of single() to handle case of no results
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
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
    },
    enabled: !!userId,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      profileId, 
      profileData 
    }: { 
      profileId: string, 
      profileData: Partial<Profile> 
    }) => {
      console.log('Updating profile with data:', profileData);
      
      const { error, data } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', profileId)
        .select();
      
      if (error) {
        console.error('Error in update:', error);
        throw error;
      }
      
      console.log('Update successful, response:', data);
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate both profile queries to ensure they're refreshed
      queryClient.invalidateQueries({ queryKey: ['profile', variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ['profiles', variables.profileId] });
      
      // Also invalidate community profiles query
      queryClient.invalidateQueries({ queryKey: ['community-profiles'] });
      
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      toast.error(`Error updating profile: ${error.message}`);
    },
  });
};

export const useLocations = (searchTerm: string = '') => {
  return useQuery({
    queryKey: ['locations', searchTerm],
    queryFn: async () => {
      let query = supabase.from('locations').select('*');
      
      if (searchTerm) {
        query = query.or(`city.ilike.%${searchTerm}%,region.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('full_name');
      
      if (error) {
        console.error('Error fetching locations:', error);
        return [];
      }
      
      return data.map(location => ({
        ...location,
        formatted_location: [location.city, location.region, location.country]
          .filter(Boolean)
          .join(', ')
      }));
    },
  });
};
