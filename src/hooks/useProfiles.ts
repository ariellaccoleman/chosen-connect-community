
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
      
      // First check if the profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', profileId)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking profile existence:', checkError);
        throw checkError;
      }
      
      let result;
      
      if (!existingProfile) {
        // Profile doesn't exist, create it
        console.log('Profile does not exist, creating new profile');
        const { data, error: insertError } = await supabase
          .from('profiles')
          .insert({ 
            id: profileId, 
            ...profileData 
          })
          .select();
          
        if (insertError) {
          console.error('Error creating profile:', insertError);
          throw insertError;
        }
        
        result = data;
      } else {
        // Profile exists, update it
        console.log('Profile exists, updating');
        const { data, error: updateError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', profileId)
          .select();
        
        if (updateError) {
          console.error('Error updating profile:', updateError);
          throw updateError;
        }
        
        result = data;
      }
      
      console.log('Operation successful, response:', result);
      return result;
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
